const { getAllUpdates } = require("../services/updateService");

function fetchAllUpdates(req, res) {
  res.json(getAllUpdates());
}

module.exports = {
  fetchAllUpdates
};