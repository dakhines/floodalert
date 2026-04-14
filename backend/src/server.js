const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const locationRoutes = require("./routes/locationRoutes");
const updateRoutes = require("./routes/updateRoutes");

app.use("/locations", locationRoutes);
app.use("/updates", updateRoutes);

app.get("/health", (req, res) => {
  res.json({ message: "Backend is running" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});