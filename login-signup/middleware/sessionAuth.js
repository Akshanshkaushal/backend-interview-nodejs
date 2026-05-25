const User = require("../models/User");

/**
 * Middleware: Check if user is authenticated via session
 */
const isSessionAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.isAuthenticated) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  next();
};

/**
 * RBAC Middleware for Session-Based Auth
 * 
 * Usage: authorizeSession("admin", "superadmin")(req, res, next)
 */
const authorizeSession = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.session.isAuthenticated) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      // Verify user role from session
      const userRole = req.session.userRole;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden: Only ${allowedRoles.join(", ")} can access this resource`,
        });
      }

      next();
    } catch (error) {
      console.error("Authorization Error:", error);
      return res.status(500).json({
        success: false,
        message: "Authorization failed",
      });
    }
  };
};

module.exports = {
  isSessionAuthenticated,
  authorizeSession,
};
