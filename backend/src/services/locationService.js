const mockLocations = require("../data/mockLocations.json");

function getAllLocations() {
  return mockLocations;
}

function getLocationByName(name) {
  return mockLocations.find(
    (item) => item.location.toLowerCase() === name.toLowerCase()
  );
}

module.exports = {
  getAllLocations,
  getLocationByName
};