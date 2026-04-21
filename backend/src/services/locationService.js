const mockLocations = require("../data/mockLocations.json");
const { getRawDataByCity } = require("./rawDataService");
const { analyzeLocation } = require("./aiService");

function isAiAuthIssue(error) {
  const message = String(error?.message || "");

  return (
    message.includes("Gemini API key is invalid or missing") ||
    message.includes("401") ||
    message.includes("Unauthorized") ||
    message.includes("invalid authentication credentials")
  );
}

function getAllLocations() {
  return mockLocations;
}

async function getLocationStatusWithAI(name) {
  const loc = mockLocations.find(
    (item) => item.location.toLowerCase() === name.toLowerCase()
  );

  if (!loc) {
    throw new Error(`Location "${name}" not found in database.`);
  }

  if (!loc.state || !loc.district) {
    throw new Error(`Missing state or district for ${name}. Check mockLocations.json`);
  }

  try {
    // Gather the "useful context"
    // This calls your rawDataService which scrapes JPS, NADMA, and Satellite
    const rawDataArray = await getRawDataByCity(loc.location, loc.state, loc.district);
    const contextData = rawDataArray[0];

    // Send to AI for Analysis
    // The AI will use your priority rules to generate the userSummary
    const aiAnalysis = await analyzeLocation(contextData);

    // Return the merged object (Location info + AI results)
    return {
      ...loc,
      ...aiAnalysis, // Includes status, action, userSummary, sourceNote
      rawData: contextData // Optional: for debugging
    };
  } catch (error) {
    if (isAiAuthIssue(error)) {
      console.warn(`AI summary unavailable for ${name}. Using live rule-based data instead.`);
    } else {
      console.warn(`AI summary unavailable for ${name}: ${error.message}`);
    }
    // Fallback: return basic info if AI fails
    return null;
  }
}

module.exports = {
  getAllLocations,
  getLocationStatusWithAI
};
