const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    problemType: {
      type: String,
      required: true,
      trim: true,
    },
    explanation: {
      type: String,
      required: true,
      trim: true,
    },
    otherProblem: {
      type: String,
      default: "",
      trim: true,
    },
    imageName: {
      type: String,
      default: "",
      trim: true,
    },
    reporterEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    reporterName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
