const express = require("express");
const { getMe, login, logout, register } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", logout);
router.get("/me", protect, asyncHandler(getMe));

module.exports = router;
