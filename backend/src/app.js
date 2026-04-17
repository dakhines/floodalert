const express = require("express");
const cors = require("cors");

const locationRoutes = require("./routes/locationRoutes");
const rawDataRoutes = require("./routes/rawDataRoutes");
const updateRoutes = require("./routes/updateRoutes");
const authRoutes = require("./routes/authRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "12mb" }));

app.use("/locations", locationRoutes);
app.use("/raw-data", rawDataRoutes);
app.use("/updates", updateRoutes);
app.use("/auth", authRoutes);
app.use("/reports", reportRoutes);

app.get("/health", (req, res) => {
  res.json({ message: "Backend is running" });
});

module.exports = app;
