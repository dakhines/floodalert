// Raw data controller (mostly for debugging / internal checks).
const {
  getAllRawData,
  getRawDataByState,
  getRawDataByCity,
  getRawDataByCityAndState,
} = require("../services/rawDataService");

function fetchRawData(req, res) {
  try {
    const { city, state } = req.query;
    let rawData;

    if (city && state) {
      rawData = getRawDataByCityAndState(city, state);
    } else if (city) {
      rawData = getRawDataByCity(city);
    } else if (state) {
      rawData = getRawDataByState(state);
    } else {
      rawData = getAllRawData();
    }

    if (!rawData || rawData.length === 0) {
      return res.status(404).json({
        error: "Raw location data not found",
      });
    }

    return res.json(rawData);
  } catch (error) {
    return res.status(500).json({
      error: "Unable to fetch raw location data",
    });
  }
}

module.exports = {
  fetchRawData,
};
