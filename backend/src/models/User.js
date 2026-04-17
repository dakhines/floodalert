const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    passwordHistoryHashes: {
      type: [String],
      default: [],
    },
    state: {
      type: String,
      default: "",
      trim: true,
    },
    defaultState: {
      type: String,
      default: "",
      trim: true,
    },
    defaultDistrict: {
      type: String,
      default: "",
      trim: true,
    },
    defaultLocation: {
      type: String,
      default: "",
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
