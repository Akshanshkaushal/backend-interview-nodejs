const express = require("express");
const router = express.Router();
const { signup, login, getProfile } = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");

/**
 * POST /api/auth/signup
 * Register a new user
 */
router.post("/signup", signup);

/**
 * POST /api/auth/login
 * Login user
 */
router.post("/login", login);

/**
 * GET /api/auth/profile
 * Get user profile (Protected route)
 */
router.get("/profile", verifyToken, getProfile);

module.exports = router;
