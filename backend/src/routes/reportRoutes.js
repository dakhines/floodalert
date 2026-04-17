const express = require("express");
const { submitReport } = require("../controllers/reportController");

const router = express.Router();

router.post("/", submitReport);

module.exports = router;
