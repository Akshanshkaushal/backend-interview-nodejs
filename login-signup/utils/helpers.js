const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (userId, email, name, role = "user") => {
    
  const payload = {
    userId,
    email,
    name,
    role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: "7d",
  });

  return token;
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

// Validate password strength
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

module.exports = {
  generateToken,
  isValidEmail,
  isValidPassword,
};
