const {
  getAllRawData,
  getRawDataByCity,
} = require("../services/rawDataService");
const { analyzeLocation } = require("../services/aiService");

async function fetchAllLocations(req, res) {
  try {
    const rawData = getAllRawData();
    const aiResults = await Promise.all(
      rawData.map((locationData) => analyzeLocation(locationData))
    );

    return res.json(aiResults);
  } catch (error) {
    return res.status(500).json({ error: "Unable to analyze locations" });
  }
}

async function fetchLocationByName(req, res) {
  try {
    const [rawData] = getRawDataByCity(req.params.name);

    if (!rawData) {
      return res.status(404).json({ error: "Location not found" });
    }

    const aiResult = await analyzeLocation(rawData);
    return res.json(aiResult);
  } catch (error) {
    return res.status(500).json({ error: "Unable to analyze location" });
  }
}

module.exports = {
  fetchAllLocations,
  fetchLocationByName,
};
