const express = require("express");
const router = express.Router();
const {
  sessionSignup,
  sessionLogin,
  getCurrentUser,
  sessionLogout,
} = require("../controllers/sessionAuthController");
const { isSessionAuthenticated, authorizeSession } = require("../middleware/sessionAuth");

/**
 * Public Routes
 */

// Signup with session
// POST /api/session-auth/signup
// Body: { name, email, password, confirmPassword }
router.post("/signup", sessionSignup);

// Login with session
// POST /api/session-auth/login
// Body: { email, password }
router.post("/login", sessionLogin);

/**
 * Protected Routes - Require Authentication
 */

// Get current user from session
// GET /api/session-auth/me
router.get("/me", isSessionAuthenticated, getCurrentUser);

// Logout - destroy session
// POST /api/session-auth/logout
router.post("/logout", isSessionAuthenticated, sessionLogout);

module.exports = router;
