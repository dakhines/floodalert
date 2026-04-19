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
      "You are a flood risk analysis assistant.",
      "Analyze structured flood source data and return frontend-ready flood status JSON.",
      "Use the backend computed status/action/reason as the source of truth.",
      "Priority order: JPS water-level data first, then Public Infobanjir official flood/current alerts, then METMalaysia weather as supporting context, then NADMA as official confirmation/context.",
      "Use this severity ladder only: Safe, Risk Rising, Warning, Flood Confirmed, Evacuate.",
      "Do not escalate a Safe JPS water-level status just because weather mentions rain.",
      "Do not invent unavailable official warnings or disaster notices.",
      "Write for normal app users. Keep the wording clear, calm, short, and action-focused. Prioritize user safety without causing panic.",
      "Do not include raw threshold tables, station IDs, or internal source details unless they directly help the user understand what to do.",
      "MUST return ONLY JSON.",
      'The JSON must match this shape: {"status":"Safe | Risk Rising | Warning | Flood Confirmed | Evacuate","action":"string","reason":"string","latestUpdate":{"type":"string","summary":"string"},"lastUpdate":"string","userSummary":"string","sourceNote":"string"}',
    ].join(" "),
  });
}

async function analyzeLocation(rawData) {
  const prompt = [
    "Analyze this raw flood data and produce the required JSON output.",
    "Keep the status and action aligned with the backend computed status/action unless official flood alert data clearly supports the same or higher risk.",
    "Use userSummary for a one or two sentence explanation that a resident can understand quickly.",
    "Use sourceNote to briefly say what the result is based on, such as live water-level data, weather alerts, official notices, or no active official alert.",
    "Raw data:",
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
