const {
  checkEmail,
  deleteUser,
  completeSignup,
  initiateSignup,
  loginUser,
  resetPassword,
  sendVerificationCode,
  updateProfile,
  verifyCode,
} = require("../services/authService");

function handleError(res, error) {
  if (
    error.name === "MongooseError" ||
    error.message?.includes("initial connection")
  ) {
    return res.status(503).json({
      success: false,
      message: "Database unavailable.",
    });
  }

  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || "Something went wrong.",
  });
}

async function signup(req, res) {
  try {
    const result = await initiateSignup(req.body);
    res.status(202).json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}

async function verifySignup(req, res) {
  try {
    const user = await completeSignup(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    handleError(res, error);
  }
}

async function login(req, res) {
  try {
    const user = await loginUser(req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    handleError(res, error);
  }
}

async function verifyEmail(req, res) {
  try {
    const exists = await checkEmail(req.body.email);
    res.json({ success: true, data: { exists } });
  } catch (error) {
    handleError(res, error);
  }
}

async function updatePassword(req, res) {
  try {
    const user = await resetPassword(req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    handleError(res, error);
  }
}

async function sendCode(req, res) {
  try {
    const result = await sendVerificationCode(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}

async function verifyEmailCode(req, res) {
  try {
    const result = await verifyCode(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
}

async function updateUser(req, res) {
  try {
    const user = await updateProfile(req.body);
    res.json({ success: true, data: user });
  } catch (error) {
    handleError(res, error);
  }
}

async function removeUser(req, res) {
  try {
    const deleted = await deleteUser(req.body.email);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "No account found.",
      });
    }

    return res.json({ success: true });
  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  login,
  removeUser,
  sendCode,
  signup,
  updatePassword,
  updateUser,
  verifyEmail,
  verifyEmailCode,
  verifySignup,
};
