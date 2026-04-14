const {
  getAllLocations,
  getLocationByName
} = require("../services/locationService");

function fetchAllLocations(req, res) {
  res.json(getAllLocations());
}

function fetchLocationByName(req, res) {
  const location = getLocationByName(req.params.name);

  if (!location) {
    return res.status(404).json({ error: "Location not found" });
  }

  res.json(location);
}

module.exports = {
  fetchAllLocations,
  fetchLocationByName
};