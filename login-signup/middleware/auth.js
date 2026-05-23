const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Verify JWT Token
 * All protected routes need this middleware first
 * Usage: app.get("/route", verifyToken, (req, res) => {})
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from headers
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token format",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    
    req.userId = decoded.userId;
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token verification failed",
      error: error.message,
    });
  }
};

/**
 * RBAC Authorization Middleware
 * Checks if user has required role
 * Usage: 
 *   app.get("/admin", verifyToken, authorize("admin"), handler)
 *   app.get("/super", verifyToken, authorize("superadmin"), handler)
 *   app.get("/multi", verifyToken, authorize("admin", "superadmin"), handler)
 */
const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Verify user is authenticated (userId should exist)
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      // Get full user data with role from database
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if user account is active
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your account has been deactivated by admin",
        });
      }

      // Check if user has one of the allowed roles
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role(s): ${allowedRoles.join(", ")}. Your role: ${user.role}`,
        });
      }

      // Add user details to request for later use
      req.userRole = user.role;
      req.userDetails = user;
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Authorization check failed",
        error: error.message,
      });
    }
  };
};

module.exports = { verifyToken, authorize };
