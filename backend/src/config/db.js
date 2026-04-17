const mongoose = require("mongoose");

const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/floodalert";

mongoose.set("bufferCommands", false);

async function connectDb() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_MONGODB_URI;

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log("MongoDB connected");
  return mongoose.connection;
}

module.exports = { connectDb };
