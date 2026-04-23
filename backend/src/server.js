// Backend entrypoint. Loads env vars, connects MongoDB, then starts Express.
const dotenv = require("dotenv");
const app = require("./app");
const { connectDb } = require("./config/db");

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDb();
  } catch (error) {
    console.error("MongoDB connection failed. Auth routes will not work until MongoDB is available.");
    console.error(error.message);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
