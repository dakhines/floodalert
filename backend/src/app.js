const express = require("express");
const cors = require("cors");

const locationRoutes = require("./routes/locationRoutes");
const rawDataRoutes = require("./routes/rawDataRoutes");
const updateRoutes = require("./routes/updateRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/locations", locationRoutes);
app.use("/raw-data", rawDataRoutes);
app.use("/updates", updateRoutes);

app.get("/health", (req, res) => {
  res.json({ message: "Backend is running" });
});

module.exports = app;
