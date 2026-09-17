const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
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
    favoriteGenres: user.favoriteGenres
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
    favoriteGenres
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

module.exports = {
  getMe,
  login,
  logout,
  register
};
