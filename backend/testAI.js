// backend/testAI.js
require('dotenv').config();
const { getLocationStatusWithAI } = require("./src/services/locationService");
const { analyzeLocation } = require("./src/services/aiService"); // Import this to test AI directly

async function runTest(scenarioName, locationName, manualData = null) {
  console.log(`\n-----------------------------------------`);
  console.log(` TEST CASE: ${scenarioName}`);
  console.log(` Location: ${locationName}`);
  
  try {
    let result;
    
    // If we provided manual data, test the AI "Brain" directly (Point 3 & 5)
    if (manualData) {
      console.log(" Using Mock Data Scenario...");
      result = await analyzeLocation(manualData);
    } else {
      // Otherwise, test the full system with live/scraped data
      result = await getLocationStatusWithAI(locationName);
    }

    // 1. Check for Null Result (Stops the "Cannot read properties of null" crash)
    if (!result) {
      console.error(` FAILED: Function returned null. Check your API Key or if ${locationName} has State/District in mockLocations.json`);
      return;
    }

    // 2. Validate JSON Structure (Point 4)
    const requiredFields = ['status', 'action', 'reason', 'latestUpdate', 'lastUpdate', 'userSummary', 'sourceNote'];
    const missing = requiredFields.filter(f => !result[f]);
    
    if (missing.length > 0) {
      console.log(` FAILED: AI missing fields: ${missing.join(', ')}`);
      console.log(" Partial Result Received:", JSON.stringify(result, null, 2));
    } else {
      console.log(` JSON Format Correct`);
      console.log(` User Summary: "${result.userSummary}"`);
      console.log(` Action: ${result.action}`);
      console.log(` Status: ${result.status}`);
      console.log(` Source Note: ${result.sourceNote}`);
    }
  } catch (error) {
    // Detailed error logging (Point 1/3)
    console.error(` CRASH:`, error.message);
  }
}

async function start() {
  console.log("--- AWAS AI VALIDATION SUITE ---");

  // SCENARIO 1: Live Data Check
  await runTest("Live Data Check", "Durian Tunggal");

  // SCENARIO 2: Force "Evacuate" (Point 3 & 6)
  // This allows you to test 20 scenarios without waiting for a flood
  const evacuateScenario = {
    location: "Durian Tunggal",
    jps: { status: "Normal" },
    officialNotice: "EVACUATE NOW - OFFICIAL NADMA NOTICE",
    satellite: { hasFloodSignal: true }
  };
  await runTest("Force Evacuate (Priority Test)", "Durian Tunggal", evacuateScenario);

  // SCENARIO 3: Satellite Trap (Point 7)
  const satelliteTrap = {
    location: "Durian Tunggal",
    jps: { status: "Normal" },
    officialNotice: null,
    satellite: { hasFloodSignal: true, note: "Surface water detected" }
  };
  await runTest("Satellite Trap (Source Priority)", "Durian Tunggal", satelliteTrap);
}

start();