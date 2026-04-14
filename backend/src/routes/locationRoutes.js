const express = require("express");
const router = express.Router();

const {
  fetchAllLocations,
  fetchLocationByName
} = require("../controllers/locationController");

router.get("/", fetchAllLocations);
router.get("/:name", fetchLocationByName);

module.exports = router;