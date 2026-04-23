// Update routes: latest updates feed.
const express = require("express");
const router = express.Router();

const { fetchAllUpdates } = require("../controllers/updateController");

router.get("/", fetchAllUpdates);

module.exports = router;