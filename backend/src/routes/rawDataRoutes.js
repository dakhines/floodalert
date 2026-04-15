const express = require("express");
const { fetchRawData } = require("../controllers/rawDataController");

const router = express.Router();

router.get("/", fetchRawData);

module.exports = router;
