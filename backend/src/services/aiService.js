const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL_NAME = "gemini-1.5-flash-latest";

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: [
      "You are a flood risk analysis assistant.",
      "Analyze structured flood source data and return frontend-ready flood status JSON.",
      "MUST return ONLY JSON.",
      'The JSON must match this shape: {"status":"Safe | Risk Rising | Warning | Flood Confirmed | Evacuate","action":"string","reason":"string","latestUpdate":{"type":"string","summary":"string"},"lastUpdate":"string"}',
    ].join(" "),
  });
}

async function analyzeLocation(rawData) {
  const model = getModel();
  const prompt = [
    "Analyze this raw flood data and produce the required JSON output.",
    "Raw data:",
    JSON.stringify(rawData),
  ].join("\n");

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
  return JSON.parse(text);
}

module.exports = { analyzeLocation };
