const User = require("../models/User");

/**
 * Session-Based Signup
 * POST /api/session-auth/signup
 */
const sessionSignup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ✅ PASSWORD MATCH CHECK (Before DB operations)
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Password format validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    // Create user (Bcrypt hashing happens in User.pre('save') hook)
    const user = await User.create({
      name,
      email,
      password, // Will be hashed automatically
    });

    // Store user data in session - NOT password!
    req.session.userId = user._id.toString();
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.session.isAuthenticated = true;

    // Session is automatically saved to MongoDB
    // Cookie is automatically set in response

    return res.status(201).json({
      success: true,
      message: "User registered and session created",
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        sessionId: req.sessionID,
      },
    });
  } catch (error) {
    console.error("Session Signup Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Session-Based Login
 * POST /api/session-auth/login
 * 
 * ✅ Password matching is required before creating session
 */
const sessionLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user and include password field (marked as select: false in model)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    // ✅ PASSWORD MATCH CHECK - Using bcrypt.compare()
    // comparePassword() is an instance method from User model
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ Password matched! Create session
    req.session.userId = user._id.toString();
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.session.isAuthenticated = true;

    // Save session to MongoDB explicitly
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Session creation failed",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionId: req.sessionID,
        },
      });
    });
  } catch (error) {
    console.error("Session Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Get Current Session User
 * GET /api/session-auth/me
 * 
 * Returns the user from session (requires authentication)
 */
const getCurrentUser = async (req, res) => {
  try {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const user = await User.findById(req.session.userId);

    if (!user || !user.isActive) {
      // Clear session if user deleted/deactivated
      req.session.destroy();
      return res.status(404).json({
        success: false,
        message: "User not found or account deactivated",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Current user retrieved",
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get Current User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Logout - Destroy Session
 * POST /api/session-auth/logout
 * 
 * Destroys the session from database and clears cookie
 */
const sessionLogout = (req, res) => {
  if (!req.session) {
    return res.status(400).json({
      success: false,
      message: "No active session",
    });
  }

  // Destroy session from MongoDB
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    // Clear cookie from client
    res.clearCookie("connect.sid"); // Express-session default cookie name

    return res.status(200).json({
      success: true,
      message: "Logout successful, session destroyed",
    });
  });
};

module.exports = {
  sessionSignup,
  sessionLogin,
  getCurrentUser,
  sessionLogout,
};
