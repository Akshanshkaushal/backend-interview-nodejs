const User = require("../models/User");
const { sendResponse, handleError, isValidId } = require("../utils/helpers");

// Create a new user
exports.createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    // Validation
    if (!name || !email) {
      return sendResponse(res, 400, "Name and email are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 409, "User already exists");
    }

    // Create new user
    const user = new User({ name, email, role: role || "user" });
    await user.save();

    sendResponse(res, 201, "User created successfully", user);
  } catch (error) {
    handleError(res, error);
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    sendResponse(res, 200, "Users fetched successfully", users);
  } catch (error) {
    handleError(res, error);
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return sendResponse(res, 400, "Invalid user ID");
    }

    const user = await User.findById(id);
    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    sendResponse(res, 200, "User fetched successfully", user);
  } catch (error) {
    handleError(res, error);
  }
};
