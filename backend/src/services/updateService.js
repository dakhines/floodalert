const mockUpdates = require("../data/mockUpdates.json");

function getAllUpdates() {
  return mockUpdates;
}

module.exports = {
  getAllUpdates
};