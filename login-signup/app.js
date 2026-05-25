const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const connectDB = require("./config/db");
const sessionConfig = require("./config/session");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sessionAuthRoutes = require("./routes/sessionAuthRoutes");

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Middleware - Order matters!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

// Session middleware - MUST come after cookie-parser
app.use(session(sessionConfig));

// Routes
// JWT-based authentication (token in header)
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Session-based authentication (cookie-based)
app.use("/api/session-auth", sessionAuthRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Login/Signup API with RBAC (JWT & Session-based)",
    jwtAuthentication: {
      signup: "POST /api/auth/signup",
      login: "POST /api/auth/login",
      profile: "GET /api/auth/profile (requires JWT token in header)",
    },
    sessionAuthentication: {
      signup: "POST /api/session-auth/signup (sets cookie)",
      login: "POST /api/session-auth/login (sets cookie)",
      me: "GET /api/session-auth/me (requires valid session)",
      logout: "POST /api/session-auth/logout (destroys session)",
    },
    adminEndpoints: {
      stats: "GET /api/admin/dashboard/stats (admin, superadmin)",
      allUsers: "GET /api/admin/users (admin, superadmin)",
      userById: "GET /api/admin/users/:userId (admin, superadmin)",
      updateRole: "PUT /api/admin/users/:userId/role (superadmin only)",
      deactivateUser: "PUT /api/admin/users/:userId/deactivate (superadmin only)",
      activateUser: "PUT /api/admin/users/:userId/activate (superadmin only)",
      deleteUser: "DELETE /api/admin/users/:userId (superadmin only)",
    },
    note: "Session cookies are HttpOnly (secure) and require credentials to be sent on requests",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
