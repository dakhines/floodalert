const nodemailer = require("nodemailer");

function getTransporter() {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port: Number(process.env.EMAIL_PORT || 587),
      secure: process.env.EMAIL_SECURE === "true",
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

async function sendVerificationEmail({ email, code, purpose }) {
  const transporter = getTransporter();
  const appName = process.env.APP_NAME || "FloodAlert";
  const subjectMap = {
    signup: `${appName} sign up verification code`,
    "change-email": `${appName} email change verification code`,
    "change-password": `${appName} password verification code`,
    "reset-password": `${appName} password reset verification code`,
  };
  const subject = subjectMap[purpose] || `${appName} verification code`;

  if (!transporter) {
    console.log(`[DEV EMAIL] ${subject} for ${email}: ${code}`);
    return { delivered: false, mode: "console" };
  }

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject,
      text: `Your ${appName} verification code is ${code}. It expires in 10 minutes.`,
    });
  } catch (error) {
    const sendError = new Error("Email sender is not configured.");
    sendError.statusCode = 500;
    throw sendError;
  }

  return { delivered: true, mode: "email" };
}

module.exports = { sendVerificationEmail };
