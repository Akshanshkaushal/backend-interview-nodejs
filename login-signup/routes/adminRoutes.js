const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  activateUser,
  deleteUser,
  getDashboardStats,
} = require("../controllers/adminController");
const { verifyToken, authorize } = require("../middleware/auth");

/**
 * All admin routes require:
 * 1. Authentication (verifyToken)
 * 2. Authorization (authorize with specific roles)
 */

// Admin & SuperAdmin Routes

/**
 * GET /api/admin/dashboard/stats
 * Get admin dashboard statistics
 * Access: Admin, SuperAdmin
 */
router.get("/dashboard/stats", verifyToken, authorize("admin", "superadmin"), getDashboardStats);

/**
 * GET /api/admin/users
 * Get all users
 * Access: Admin, SuperAdmin
 */
router.get("/users", verifyToken, authorize("admin", "superadmin"), getAllUsers);

/**
 * GET /api/admin/users/:userId
 * Get specific user details
 * Access: Admin, SuperAdmin
 */
router.get("/users/:userId", verifyToken, authorize("admin", "superadmin"), getUserById);

// SuperAdmin Only Routes

/**
 * PUT /api/admin/users/:userId/role
 * Update user role
 * Access: SuperAdmin Only
 * Body: { role: "user" | "admin" | "superadmin" }
 */
router.put(
  "/users/:userId/role",
  verifyToken,
  authorize("superadmin"),
  updateUserRole
);

/**
 * PUT /api/admin/users/:userId/deactivate
 * Deactivate user account
 * Access: SuperAdmin Only
 */
router.put(
  "/users/:userId/deactivate",
  verifyToken,
  authorize("superadmin"),
  deactivateUser
);

/**
 * PUT /api/admin/users/:userId/activate
 * Activate user account
 * Access: SuperAdmin Only
 */
router.put(
  "/users/:userId/activate",
  verifyToken,
  authorize("superadmin"),
  activateUser
);

/**
 * DELETE /api/admin/users/:userId
 * Delete user
 * Access: SuperAdmin Only
 */
router.delete(
  "/users/:userId",
  verifyToken,
  authorize("superadmin"),
  deleteUser
);

module.exports = router;
