const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-001",
  "gemini-2.0-flash-lite",
];

let workingModelName = null;

function getModelCandidates() {
  const configuredModels = String(process.env.GEMINI_MODEL || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);

  return [...new Set([...configuredModels, ...DEFAULT_MODEL_CANDIDATES])];
}

function getModel(modelName) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: [
     "You are the AWAS AI Flood Risk Analyst.",
      "Your task is to analyze flood data and provide safe, calm, and accurate summaries for residents.",
      
      "Follow this priority order strictly:",
      "1. JPS Water Level (Highest priority for current status)",
      "2. Official alerts from NADMA or Public Infobanjir (Highest priority for action advice)",
      "3. Satellite imagery (Supporting evidence only)",
      "4. Weather forecast (Supporting context only)",

      "CORE RULES:",
      "- Do NOT say 'Evacuate' unless the official backend status or NADMA explicitly supports it.",
      "- Do NOT invent or 'hallucinate' warnings that are not in the input data.",
      "- Treat satellite data as supporting evidence; do NOT confirm a flood based on satellite alone.",
      "- If data is missing or incomplete, use safe, neutral wording like 'Data currently unavailable'.",
      "- Tone: Short, user-friendly, and calm. No technical jargon (e.g., mS/cm) or scary wording unless necessary for safety.",
      "- Always advise users to follow official instructions during serious alerts.",

      "You MUST return ONLY a JSON object with this exact shape:",

      JSON.stringify({
        status: "Safe | Risk Rising | Warning | Flood Confirmed | Evacuate",
        action: "Short, clear instruction for the user",
        reason: "Brief technical justification",
        latestUpdate: {
          type: "Source name (e.g., JPS, NADMA, Satellite)",
          summary: "Short summary of that specific update"
        },
        lastUpdate: "Current time in HH:MM AM/PM format",
        userSummary: "One or two sentence explanation a normal resident can understand.",
        sourceNote: "Note about which data sources were used for this result."
      })
    ].join("\n"),
  });
}

async function analyzeLocation(rawData) {
  const prompt = [
    "Analyze the following raw data and produce the required JSON output following your priority and safety rules.",
    "Raw data input:",
    JSON.stringify(rawData),
  ].join("\n");

  const modelCandidates = workingModelName
    ? [workingModelName]
    : getModelCandidates();

  let lastError = null;

  for (const modelName of modelCandidates) {
    try {
      const model = getModel(modelName);
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const text = result.response.text();

      workingModelName = modelName;
      return JSON.parse(text);
    } catch (error) {
      if (error.message && error.message.includes("API key not valid")) {
        throw new Error("Gemini API key is invalid or missing.");
      }
      lastError = error;
      workingModelName = null;
    }
  }

  if (lastError && lastError.message.includes("API key not valid")) {
    throw new Error("Gemini API key is invalid or missing.");
  }

  throw lastError || new Error("No Gemini model candidates are available");
}

module.exports = { analyzeLocation };
