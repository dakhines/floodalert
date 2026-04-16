const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // This is very important to read your "message"

// 1. Setup Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  systemInstruction: `You are a flood risk analysis assistant.
    Analyze data and return ONLY valid JSON with: id, location, status, action, reason, lastUpdate, latestUpdate.
    Status: Safe, Risk Rising, Warning, Flood Confirmed, Evacuate.
    Return ONLY JSON. No extra text.`
});

// 2. Add the AI Route
app.post("/analyze-flood", async (req, res) => {
  try {
    const { message } = req.body; 

    // Use a specific model ID and force JSON output
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: message }] }],
      generationConfig: { 
        responseMimeType: "application/json" // This is the secret sauce!
      }
    });

    const response = await result.response;
    const text = response.text();
    console.log("Raw AI Response:", text);
    // Send the JSON back to your Command Prompt
    res.json(JSON.parse(text));

  } catch (error) {
    console.error("AI Error:", error); // LOOK AT THIS IN TERMINAL A
    res.status(500).json({ error: "The AI is having trouble thinking!" });
  }
});

app.get("/health", (req, res) => {
  res.json({ message: "Backend is running" });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log('Zhi Yi’s AI Brain is officially ONLINE on port 5001');
});
