const express = require("express");
const {
  login,
  removeUser,
  sendCode,
  signup,
  updatePassword,
  updateUser,
  verifyEmail,
  verifyEmailCode,
  verifySignup,
} = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-signup", verifySignup);
router.post("/login", login);
router.post("/check-email", verifyEmail);
router.post("/send-code", sendCode);
router.post("/verify-code", verifyEmailCode);
router.post("/reset-password", updatePassword);
router.patch("/profile", updateUser);
router.delete("/profile", removeUser);

module.exports = router;
