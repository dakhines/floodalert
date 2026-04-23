// Updates service: provides the list shown on the Updates page.
const mockUpdates = require("../data/mockUpdates.json");

function getAllUpdates() {
  return mockUpdates;
}

module.exports = {
  getAllUpdates
};
