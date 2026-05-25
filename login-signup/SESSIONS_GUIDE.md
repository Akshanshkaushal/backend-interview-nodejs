# Cookie-Based Authentication with Sessions

This guide explains how to implement **session-based authentication** using cookies instead of JWT tokens.

---

## Overview: Cookies vs JWT

### JWT (Token-Based)
```
Client sends JWT in header → Server verifies signature → No database lookup
Stateless ✅ | Scalable ✅ | Large payload ❌
```

### Sessions (Cookie-Based)
```
Client sends cookie → Server looks up session in database → Grants access
Stateful ❌ | Secure ✅ | Smaller payload ✅
```

---

## Installation

Add session dependencies:

```bash
npm install express-session connect-mongo
npm install cookie-parser
```

### Package Breakdown:
- **express-session** - Session middleware
- **connect-mongo** - Store sessions in MongoDB
- **cookie-parser** - Parse and manage cookies

---

## Session-Based Authentication Implementation

### 1. Session Middleware Configuration

**File: `config/session.js`**

```javascript
const session = require("express-session");
const MongoStore = require("connect-mongo");

const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-session-secret-key",
  store: new MongoStore({
    mongoUrl: process.env.MONGO_URI || "mongodb://localhost:27017/login-signup",
    touchAfter: 24 * 3600, // Lazy session update (in seconds)
  }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    httpOnly: true, // Prevent JavaScript access (XSS protection)
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days in milliseconds
    sameSite: "strict", // CSRF protection
  },
};

module.exports = sessionConfig;
```

### 2. Express App Setup with Sessions

**File: `app.js` (Updated)**

```javascript
const express = require("express");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const connectDB = require("./config/db");
const sessionConfig = require("./config/session");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

// Connect to database
connectDB();

// Middleware - Order matters!
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Parse cookies

// Session middleware - MUST come after cookie-parser
app.use(session(sessionConfig));

// Initialize Passport (if using)
// app.use(passport.initialize());
// app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Authentication system with sessions",
    sessionUser: req.session.userId ? "Yes" : "No",
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
```

### 3. Session-Based Login/Logout Controller

**File: `controllers/sessionAuthController.js`**

```javascript
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

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
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

    // Create user
    const user = await User.create({
      name,
      email,
      password,
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
        sessionId: req.sessionID, // Show session ID for debugging
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
 */
const sessionLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
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

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Create session
    req.session.userId = user._id.toString();
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    req.session.isAuthenticated = true;

    // Save session to MongoDB (express-session handles this)
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
 */
const sessionLogout = (req, res) => {
  if (!req.session) {
    return res.status(400).json({
      success: false,
      message: "No session to destroy",
    });
  }

  // Destroy session from database and client
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: "Logout failed",
      });
    }

    // Clear cookie from client
    res.clearCookie("sid"); // Express-session default cookie name

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
```

### 4. Session Verification Middleware

**File: `middleware/sessionAuth.js`**

```javascript
const User = require("../models/User");

/**
 * Check if user is authenticated via session
 */
const isSessionAuthenticated = (req, res, next) => {
  if (!req.session || !req.session.isAuthenticated) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  // Optionally verify user is still active in database
  next();
};

/**
 * RBAC Middleware for Sessions
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

      // Fetch user to check current role
      const user = await User.findById(req.session.userId);

      if (!user) {
        req.session.destroy();
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!user.isActive) {
        req.session.destroy();
        return res.status(403).json({
          success: false,
          message: "Account deactivated",
        });
      }

      // Check role
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required: ${allowedRoles.join(", ")}. Your role: ${user.role}`,
        });
      }

      // Update session with latest role (in case it changed)
      req.session.userRole = user.role;

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Authorization failed",
        error: error.message,
      });
    }
  };
};

module.exports = { isSessionAuthenticated, authorizeSession };
```

### 5. Session-Based Routes

**File: `routes/sessionAuthRoutes.js`**

```javascript
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
 * POST /api/session-auth/signup
 * Register new user with session
 */
router.post("/signup", sessionSignup);

/**
 * POST /api/session-auth/login
 * Login and create session
 */
router.post("/login", sessionLogin);

/**
 * GET /api/session-auth/me
 * Get current authenticated user (Protected)
 */
router.get("/me", isSessionAuthenticated, getCurrentUser);

/**
 * POST /api/session-auth/logout
 * Destroy session and logout
 */
router.post("/logout", isSessionAuthenticated, sessionLogout);

module.exports = router;
```

### 6. Update .env

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/login-signup
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret-key
NODE_ENV=development
```

---

## How Sessions Work - Step by Step

### **User Signup/Login Flow**

```
1. User submits credentials
   ↓
2. Server validates password
   ↓
3. Server creates session object:
   {
     _id: random_session_id,
     userId: "...",
     userEmail: "...",
     isAuthenticated: true,
     expires: future_date,
     ...
   }
   ↓
4. Session stored in MongoDB
   ↓
5. Server sends SET-COOKIE header:
   Set-Cookie: sid=random_session_id; httpOnly; secure; sameSite=strict
   ↓
6. Browser stores cookie automatically
   ↓
7. For every future request, browser sends:
   Cookie: sid=random_session_id
   ↓
8. Server looks up session in MongoDB using session ID
   ↓
9. Session data available in req.session
```

### **Example Request with Session Cookie**

```
Login Request:
POST /api/session-auth/login
Body: { email: "john@example.com", password: "123456" }

Response:
Set-Cookie: sid=abc123def456; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800

From now on, browser auto-sends with EVERY request:
Cookie: sid=abc123def456
```

### **Accessing Session Data in Routes**

```javascript
// In any route handler after session middleware:

router.get("/protected", isSessionAuthenticated, (req, res) => {
  console.log(req.session.userId);      // "507f1f77bcf86cd799439011"
  console.log(req.session.userEmail);   // "john@example.com"
  console.log(req.session.userRole);    // "admin"
  console.log(req.sessionID);           // "abc123def456"
  
  res.json({ data: req.session });
});
```

---

## Session vs JWT Comparison

| Feature | Session-Based | JWT |
|---------|--------------|-----|
| **Storage** | Server (Database) | Client (Token) |
| **Cookie** | Yes, HttpOnly | Optional |
| **Stateful** | Yes ✅ | No ❌ |
| **Scalability** | Single server | Multi-server ✅ |
| **Database Lookup** | Every request ✅ | Never needed ❌ |
| **Memory** | Server ❌ | Client ✅ |
| **Session Invalidation** | Instant | Not until expiry |
| **CSRF Protection** | Needed | Built-in ✅ |
| **Security** | Very Secure ✅ | Secure if used right |

---

## Key Concepts

### **1. Session Storage**

```javascript
// Sessions stored in MongoDB collection:
db.sessions.findOne()
{
  "_id": "abc123def456",
  "expires": ISODate("2024-01-20T10:00:00Z"),
  "session": {
    "userId": "507f1f77bcf86cd799439011",
    "userEmail": "john@example.com",
    "userRole": "admin",
    "isAuthenticated": true
  }
}
```

### **2. Cookie Attributes**

```javascript
{
  secure: true,        // HTTPS only (prevents man-in-the-middle)
  httpOnly: true,      // JavaScript cannot access (XSS protection)
  maxAge: 604800000,   // 7 days
  sameSite: "strict",  // CSRF protection (no cross-site cookies)
  path: "/",           // Available on all routes
}
```

### **3. Session Lifecycle**

```
User Logs In
    ↓
Session Created in MongoDB
    ↓
Cookie Sent to Browser (Set-Cookie header)
    ↓
Browser Stores Cookie
    ↓
User Makes Requests
    ↓
Browser Auto-sends Cookie
    ↓
Server Verifies Session in DB
    ↓
Grant/Deny Access
    ↓
User Logs Out
    ↓
Session Destroyed in DB
    ↓
Cookie Cleared from Browser
```

---

## Security Features

✅ **HttpOnly Cookies** - JavaScript cannot steal via XSS  
✅ **Secure Flag** - HTTPS only transmission  
✅ **SameSite Attribute** - CSRF protection  
✅ **Server-Side Storage** - Secrets never leave server  
✅ **Session Expiry** - Auto-logout after inactivity  
✅ **Database Verification** - Role checked on every request  
✅ **Cookie Signing** - Cannot be tampered with  

---

## Comparing with Current JWT Implementation

### **Current (JWT Token)**
```bash
POST /api/auth/login
response: { token: "eyJhbGc..." }

# User stores in localStorage or sessionStorage

GET /api/auth/profile
Headers: Authorization: Bearer eyJhbGc...
# No database lookup
```

### **Session-Based**
```bash
POST /api/session-auth/login
response: Set-Cookie: sid=abc123; HttpOnly
# Browser stores automatically

GET /api/session-auth/me
Headers: Cookie: sid=abc123
# Database lookup for verification
```

---

## Real-World Scenario

### **Scenario: Change User Role**

**With JWT:**
```
1. SuperAdmin updates user role in DB
2. Token still has old role ❌
3. User continues with old permissions
4. Must wait for token expiry or logout/login
```

**With Sessions:**
```
1. SuperAdmin updates user role in DB
2. Next request fetches from DB ✅
3. User immediately has new permissions
4. Instant permission update
```

---

## Quick Setup Checklist

- [ ] Install: `npm install express-session connect-mongo cookie-parser`
- [ ] Create `config/session.js`
- [ ] Create `controllers/sessionAuthController.js`
- [ ] Create `middleware/sessionAuth.js`
- [ ] Create `routes/sessionAuthRoutes.js`
- [ ] Update `app.js` with session middleware
- [ ] Update `.env` with SESSION_SECRET
- [ ] Test with Postman/curl

---

## Testing Sessions in Postman

### Test 1: Signup with Session
```
POST http://localhost:5000/api/session-auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}

Response includes Set-Cookie header automatically
```

### Test 2: Access Protected Route
```
GET http://localhost:5000/api/session-auth/me

Postman auto-manages cookies!
Response: { userId, name, email, role }
```

### Test 3: Logout
```
POST http://localhost:5000/api/session-auth/logout

Response: Session destroyed, cookie cleared
```

### Test 4: Try After Logout
```
GET http://localhost:5000/api/session-auth/me

Response: 401 Not authenticated (session no longer exists)
```

---

## Hybrid Approach: JWT + Sessions

You can use both simultaneously:
- **Internal APIs** → Sessions (security-critical)
- **Mobile Apps** → JWT (cookies not available)
- **Browsers** → Sessions (better security)

```javascript
app.use("/api/auth", jwtRoutes);           // JWT for mobile
app.use("/api/session-auth", sessionRoutes); // Sessions for web
```

---

See examples in `sessionAuthController.js` for complete implementation!
