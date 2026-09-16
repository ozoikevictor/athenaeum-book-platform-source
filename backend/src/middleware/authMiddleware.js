const jwt = require("jsonwebtoken");
const User = require("../models/User");

function getJwtSecret() {
  return process.env.JWT_SECRET || "athenaeum-local-development-secret";
}

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ message: "Please sign in first" });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({ message: "Account not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Your session has expired. Please sign in again." });
  }
}

async function optionalProtect(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme === "Bearer" && token) {
      const payload = jwt.verify(token, getJwtSecret());
      req.user = await User.findById(payload.id).select("-password");
    }
  } catch (error) {
    req.user = null;
  }

  next();
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "Admin") {
    return res.status(403).json({ message: "Admin access is required" });
  }

  next();
}

module.exports = {
  adminOnly,
  getJwtSecret,
  optionalProtect,
  protect
};
