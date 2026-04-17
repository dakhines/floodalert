const mongoose = require("mongoose");

const verificationCodeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    purpose: {
      type: String,
      required: true,
      enum: ["signup", "reset-password", "change-password", "change-email"],
    },
    codeHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    verificationToken: {
      type: String,
      default: "",
    },
    verifiedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

verificationCodeSchema.index({ email: 1, purpose: 1 });
verificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("VerificationCode", verificationCodeSchema);
