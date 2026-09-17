const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtSecret } = require("../middleware/authMiddleware");

function formatUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    books: user.books,
    status: user.status,
    favoriteGenres: user.favoriteGenres,
    profileImage: user.profileImage,
    readingPreferences: user.readingPreferences
  };
}

function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: "7d" });
}

async function register(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "MongoDB is still connecting. Please try again in a moment." });
  }

  const { name, email, password, favoriteGenres = [] } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    return res.status(409).json({ message: "An account with this email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    role: "User",
    books: 0,
    status: "Active",
    password: hashedPassword,
    favoriteGenres,
    profileImage: ""
  });

  const safeUser = formatUser(user);
  return res.status(201).json({ user: safeUser, token: createToken(safeUser) });
}

async function login(req, res) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: "MongoDB is still connecting. Please try again in a moment." });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;
  const legacyPasswordMatches = user && user.password === password;

  if (!user || (!passwordMatches && !legacyPasswordMatches)) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  let userChanged = false;

  if (legacyPasswordMatches) {
    user.password = await bcrypt.hash(password, 10);
    userChanged = true;
  }

  const normalizedRole = String(user.role).toLowerCase() === "admin" ? "Admin" : "User";
  if (user.role !== normalizedRole) {
    user.role = normalizedRole;
    userChanged = true;
  }

  if (userChanged) {
    await user.save();
  }

  const safeUser = formatUser(user);
  return res.json({ user: safeUser, token: createToken(safeUser) });
}

function logout(req, res) {
  res.json({ message: "Signed out" });
}

async function getMe(req, res) {
  res.json({ user: req.user ? formatUser(req.user) : null });
}

async function forgotPassword(req, res) {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const user = await User.findOne({ email });
  const successMessage = "If that email belongs to an account, a password reset link has been sent.";
  if (!user) {
    return res.json({ message: successMessage });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000);
  await user.save();

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "");
  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    return res.status(503).json({ message: "Password reset email is not configured yet." });
  }

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: process.env.PASSWORD_RESET_FROM || "Athenaeum <onboarding@resend.dev>",
      to: [user.email],
      subject: "Reset your Athenaeum password",
      html: `<p>Hello ${user.name},</p><p>Use the secure link below to choose a new password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset my password</a></p><p>If you did not request this, you can ignore this email.</p>`
    })
  });

  if (!emailResponse.ok) {
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();
    return res.status(502).json({ message: "The reset email could not be sent. Please try again." });
  }

  return res.json({ message: successMessage });
}

async function resetPassword(req, res) {
  const token = String(req.body.token || "");
  const password = String(req.body.password || "");
  if (!token || password.length < 6) {
    return res.status(400).json({ message: "A valid reset link and a password of at least 6 characters are required." });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json({ message: "This password reset link is invalid or has expired." });
  }

  user.password = await bcrypt.hash(password, 10);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();
  return res.json({ message: "Password changed successfully. You can now sign in." });
}

module.exports = {
  forgotPassword,
  getMe,
  login,
  logout,
  register,
  resetPassword
};
