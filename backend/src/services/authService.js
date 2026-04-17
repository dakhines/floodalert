const bcrypt = require("bcryptjs");
const User = require("../models/User");
const PendingSignup = require("../models/PendingSignup");
const {
  assertVerificationToken,
  consumeVerificationToken,
  sendVerificationCode: sendRawVerificationCode,
  verifyCode,
} = require("./verificationService");

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9]+$/;
const PASSWORD_HISTORY_LIMIT = 5;

function normalize(value) {
  return String(value || "").trim();
}

function normalizeEmail(email) {
  return normalize(email).toLowerCase();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toClientUser(user) {
  if (!user) {
    return null;
  }

  const defaultState = user.defaultState || user.state || "";
  const defaultLocation = user.defaultLocation || "";

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    defaultLocation,
    state: defaultState,
    defaultState,
    defaultDistrict: user.defaultDistrict || "",
    location: defaultLocation,
    profileImage: user.profileImage || "",
  };
}

function assertValidPassword(password) {
  if (!passwordPattern.test(password || "")) {
    const error = new Error("Password must use uppercase, lowercase, and numbers only.");
    error.statusCode = 400;
    throw error;
  }
}

async function hasUsedPassword(user, password) {
  const history = Array.isArray(user.passwordHistoryHashes)
    ? user.passwordHistoryHashes
    : [];
  const hashes = [user.passwordHash, ...history].filter(Boolean);

  for (const hash of hashes) {
    if (await bcrypt.compare(password, hash)) {
      return true;
    }
  }

  return false;
}

function rememberPreviousPassword(user) {
  const history = Array.isArray(user.passwordHistoryHashes)
    ? user.passwordHistoryHashes
    : [];

  user.passwordHistoryHashes = [...new Set([user.passwordHash, ...history])]
    .filter(Boolean)
    .slice(0, PASSWORD_HISTORY_LIMIT);
}

async function assertUnusedPassword(user, password) {
  if (await hasUsedPassword(user, password)) {
    const error = new Error("Use a different password.");
    error.statusCode = 400;
    throw error;
  }
}

async function findByIdentifier(identifier) {
  const value = normalize(identifier);
  if (!value) {
    return null;
  }

  return User.findOne({
    $or: [
      { name: new RegExp(`^${escapeRegExp(value)}$`, "i") },
      { email: normalizeEmail(value) },
    ],
  });
}

async function createUser(input) {
  const name = normalize(input.name || input.username);
  const email = normalizeEmail(input.email);
  const password = normalize(input.password);
  const defaultState = normalize(input.defaultState || input.state);
  const defaultDistrict = normalize(input.defaultDistrict || input.district);
  const defaultLocation = normalize(input.defaultLocation || input.location);

  if (!name || !email || !password || !defaultState || !defaultLocation) {
    const error = new Error("Username, email, password, state, and default location are required.");
    error.statusCode = 400;
    throw error;
  }

  assertValidPassword(password);

  const existingName = await User.findOne({
    name: new RegExp(`^${escapeRegExp(name)}$`, "i"),
  });
  if (existingName) {
    const error = new Error("Username is already taken.");
    error.statusCode = 409;
    throw error;
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    const error = new Error("Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    passwordHistoryHashes: [],
    state: defaultState,
    defaultState,
    defaultDistrict,
    defaultLocation,
    profileImage: input.profileImage || "",
  });

  return toClientUser(user);
}

async function initiateSignup(input) {
  const name = normalize(input.name || input.username);
  const email = normalizeEmail(input.email);
  const password = normalize(input.password);
  const defaultState = normalize(input.defaultState || input.state);
  const defaultDistrict = normalize(input.defaultDistrict || input.district);
  const defaultLocation = normalize(input.defaultLocation || input.location);

  if (!name || !email || !password || !defaultState || !defaultLocation) {
    const error = new Error("Username, email, password, state, and default location are required.");
    error.statusCode = 400;
    throw error;
  }

  assertValidPassword(password);

  const existingName = await User.findOne({
    name: new RegExp(`^${escapeRegExp(name)}$`, "i"),
  });
  if (existingName) {
    const error = new Error("Username is already taken.");
    error.statusCode = 409;
    throw error;
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    const error = new Error("Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  await PendingSignup.findOneAndUpdate(
    { email },
    {
      email,
      userData: {
        name,
        email,
        password,
        defaultState,
        state: defaultState,
        defaultDistrict,
        defaultLocation,
        profileImage: input.profileImage || "",
      },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const verification = await sendRawVerificationCode(email, "signup");
  return {
    pending: true,
    email,
    expiresInMinutes: verification.expiresInMinutes,
    delivery: verification.delivery,
  };
}

async function sendVerificationCode(emailOrPayload, purposeArg) {
  const payload =
    typeof emailOrPayload === "object"
      ? emailOrPayload || {}
      : { email: emailOrPayload, purpose: purposeArg };
  const email = normalizeEmail(payload.email);
  const purpose = normalize(payload.purpose);

  if (purpose === "change-email") {
    const currentEmail = normalizeEmail(payload.currentEmail);
    const currentPassword = normalize(payload.currentPassword);

    if (!currentEmail || !currentPassword) {
      const error = new Error("Please enter your password.");
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findOne({ email: currentEmail });
    if (!user) {
      const error = new Error("Please log in again.");
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      const error = new Error("Current password is incorrect.");
      error.statusCode = 401;
      throw error;
    }

    if (email === currentEmail) {
      const error = new Error("New email cannot be the same as your current email.");
      error.statusCode = 400;
      throw error;
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      const error = new Error("Email is already registered.");
      error.statusCode = 409;
      throw error;
    }
  }

  return sendRawVerificationCode(email, purpose);
}

async function completeSignup({ email, code }) {
  const normalizedEmail = normalizeEmail(email);
  const pendingSignup = await PendingSignup.findOne({ email: normalizedEmail });

  if (!pendingSignup || pendingSignup.expiresAt <= new Date()) {
    const error = new Error("Sign up expired. Please start again.");
    error.statusCode = 400;
    throw error;
  }

  await verifyCode({
    email: normalizedEmail,
    purpose: "signup",
    code,
    issueToken: false,
  });

  const userData = pendingSignup.userData || {};
  const existingName = await User.findOne({
    name: new RegExp(`^${escapeRegExp(userData.name)}$`, "i"),
  });
  const existingEmail = await User.findOne({ email: normalizedEmail });

  if (existingName || existingEmail) {
    await PendingSignup.deleteOne({ _id: pendingSignup._id });
    const error = new Error(existingName ? "Username is already taken." : "Email is already registered.");
    error.statusCode = 409;
    throw error;
  }

  const user = await createUser(userData);
  await PendingSignup.deleteOne({ _id: pendingSignup._id });
  return user;
}

async function loginUser({ identifier, password }) {
  const user = await findByIdentifier(identifier);

  if (!user) {
    const error = new Error("No account found.");
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(password || "", user.passwordHash);
  if (!isMatch) {
    const error = new Error("Invalid username or password.");
    error.statusCode = 401;
    throw error;
  }

  return toClientUser(user);
}

async function checkEmail(email) {
  const user = await User.findOne({ email: normalizeEmail(email) });
  return Boolean(user);
}

async function resetPassword({ email, password, verificationToken }) {
  assertValidPassword(password);

  const user = await User.findOne({ email: normalizeEmail(email) });
  if (!user) {
    const error = new Error("No account found for that email.");
    error.statusCode = 404;
    throw error;
  }

  await assertUnusedPassword(user, password);

  await assertVerificationToken({
    email,
    purpose: "reset-password",
    verificationToken,
  });

  rememberPreviousPassword(user);
  user.passwordHash = await bcrypt.hash(password, 12);
  await user.save();
  await consumeVerificationToken({
    email,
    purpose: "reset-password",
    verificationToken,
  });
  return toClientUser(user);
}

async function updateProfile(input) {
  const currentEmail = normalizeEmail(input.currentEmail || input.email);
  const user = await User.findOne({ email: currentEmail });

  if (!user) {
    const error = new Error("Please log in again.");
    error.statusCode = 401;
    throw error;
  }

  if (
    Object.prototype.hasOwnProperty.call(input, "name") &&
    !normalize(input.name)
  ) {
    const error = new Error("Please enter a new username.");
    error.statusCode = 400;
    throw error;
  }

  if (
    Object.prototype.hasOwnProperty.call(input, "email") &&
    !normalizeEmail(input.email)
  ) {
    const error = new Error("Please enter a valid email.");
    error.statusCode = 400;
    throw error;
  }

  if (input.currentPassword !== undefined) {
    if (!normalize(input.currentPassword)) {
      const error = new Error("Please enter your password.");
      error.statusCode = 400;
      throw error;
    }

    const isMatch = await bcrypt.compare(input.currentPassword || "", user.passwordHash);
    if (!isMatch) {
      const error = new Error("Current password is incorrect.");
      error.statusCode = 401;
      throw error;
    }
  }

  const nextName = normalize(input.name) || user.name;
  const nextEmail = normalizeEmail(input.email) || user.email;

  if (nextName.toLowerCase() !== user.name.toLowerCase()) {
    const existingName = await User.findOne({
      _id: { $ne: user._id },
      name: new RegExp(`^${escapeRegExp(nextName)}$`, "i"),
    });
    if (existingName) {
      const error = new Error("Username is already taken.");
      error.statusCode = 409;
      throw error;
    }
  }

  if (nextEmail !== user.email) {
    const existingEmail = await User.findOne({
      _id: { $ne: user._id },
      email: nextEmail,
    });
    if (existingEmail) {
      const error = new Error("Email is already registered.");
      error.statusCode = 409;
      throw error;
    }

    await assertVerificationToken({
      email: nextEmail,
      purpose: "change-email",
      verificationToken: input.emailVerificationToken,
    });
  }

  if (input.password) {
    assertValidPassword(input.password);
    await assertUnusedPassword(user, input.password);

    await assertVerificationToken({
      email: user.email,
      purpose: "change-password",
      verificationToken: input.verificationToken,
    });

    rememberPreviousPassword(user);
    user.passwordHash = await bcrypt.hash(input.password, 12);
  }

  user.name = nextName;
  user.email = nextEmail;

  if (input.defaultState !== undefined || input.state !== undefined) {
    const nextState = normalize(input.defaultState || input.state);
    user.state = nextState;
    user.defaultState = nextState;
  }

  if (input.defaultDistrict !== undefined) {
    user.defaultDistrict = normalize(input.defaultDistrict);
  }

  if (input.defaultLocation !== undefined) {
    user.defaultLocation = normalize(input.defaultLocation);
  }

  if (input.removeProfileImage) {
    user.profileImage = "";
  } else if (input.profileImage !== undefined) {
    user.profileImage = input.profileImage || "";
  }

  await user.save();

  if (nextEmail !== currentEmail) {
    await consumeVerificationToken({
      email: nextEmail,
      purpose: "change-email",
      verificationToken: input.emailVerificationToken,
    });
  }

  if (input.password) {
    await consumeVerificationToken({
      email: user.email,
      purpose: "change-password",
      verificationToken: input.verificationToken,
    });
  }

  return toClientUser(user);
}

async function deleteUser(email) {
  const result = await User.deleteOne({ email: normalizeEmail(email) });
  return result.deletedCount > 0;
}

module.exports = {
  checkEmail,
  completeSignup,
  createUser,
  deleteUser,
  initiateSignup,
  loginUser,
  resetPassword,
  sendVerificationCode,
  verifyCode,
  updateProfile,
};
