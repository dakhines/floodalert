const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const VerificationCode = require("../models/VerificationCode");
const { sendVerificationEmail } = require("./emailService");

const CODE_TTL_MINUTES = 10;
const VERIFIED_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateCode() {
  return crypto.randomInt(1000, 10000).toString();
}

function minutesFromNow(minutes) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function sendVerificationCode(email, purpose) {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !purpose) {
    const error = new Error("Email and purpose are required.");
    error.statusCode = 400;
    throw error;
  }

  const existingRecord = await VerificationCode.findOne({
    email: normalizedEmail,
    purpose,
    expiresAt: { $gt: new Date() },
  });

  if (
    existingRecord?.updatedAt &&
    Date.now() - existingRecord.updatedAt.getTime() <
      RESEND_COOLDOWN_SECONDS * 1000
  ) {
    return {
      email: normalizedEmail,
      purpose,
      expiresInMinutes: CODE_TTL_MINUTES,
      delivery: {
        skipped: true,
        reason: "recent-code-already-sent",
      },
    };
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 12);

  await VerificationCode.findOneAndUpdate(
    { email: normalizedEmail, purpose },
    {
      email: normalizedEmail,
      purpose,
      codeHash,
      attempts: 0,
      expiresAt: minutesFromNow(CODE_TTL_MINUTES),
      verificationToken: "",
      verifiedUntil: null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const delivery = await sendVerificationEmail({
    email: normalizedEmail,
    code,
    purpose,
  });

  return {
    email: normalizedEmail,
    purpose,
    expiresInMinutes: CODE_TTL_MINUTES,
    delivery,
  };
}

async function verifyCode({ email, purpose, code, issueToken = true }) {
  const normalizedEmail = normalizeEmail(email);
  const record = await VerificationCode.findOne({
    email: normalizedEmail,
    purpose,
  });

  if (!record || record.expiresAt <= new Date()) {
    const error = new Error("Code expired. Send a new one.");
    error.statusCode = 400;
    throw error;
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    const error = new Error("Too many attempts. Send a new code.");
    error.statusCode = 429;
    throw error;
  }

  const isMatch = await bcrypt.compare(String(code || ""), record.codeHash);
  if (!isMatch) {
    record.attempts += 1;
    await record.save();

    const error = new Error("Invalid verification code.");
    error.statusCode = 400;
    throw error;
  }

  if (!issueToken) {
    await VerificationCode.deleteOne({ _id: record._id });
    return { verified: true };
  }

  const verificationToken = crypto.randomBytes(24).toString("hex");
  record.verificationToken = verificationToken;
  record.verifiedUntil = minutesFromNow(VERIFIED_TTL_MINUTES);
  await record.save();

  return {
    verified: true,
    verificationToken,
    verifiedUntil: record.verifiedUntil,
  };
}

async function findValidVerificationToken({ email, purpose, verificationToken }) {
  const normalizedEmail = normalizeEmail(email);
  const record = await VerificationCode.findOne({
    email: normalizedEmail,
    purpose,
    verificationToken,
    verifiedUntil: { $gt: new Date() },
  });

  if (!record) {
    const error = new Error("Verification expired. Request a new code.");
    error.statusCode = 401;
    throw error;
  }

  return record;
}

async function assertVerificationToken(payload) {
  await findValidVerificationToken(payload);
  return true;
}

async function consumeVerificationToken(payload) {
  const record = await findValidVerificationToken(payload);
  await VerificationCode.deleteOne({ _id: record._id });
  return true;
}

module.exports = {
  assertVerificationToken,
  consumeVerificationToken,
  sendVerificationCode,
  verifyCode,
};
