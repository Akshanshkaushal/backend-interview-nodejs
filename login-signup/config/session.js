const session = require("express-session");
const MongoStore = require("connect-mongo");

const sessionConfig = {
  secret: process.env.SESSION_SECRET || "your-session-secret-key",
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI || "mongodb://localhost:27017/login-signup",
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
