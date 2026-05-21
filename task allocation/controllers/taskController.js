const Task = require("../models/Task");
const User = require("../models/User");
const { sendResponse, handleError, isValidId } = require("../utils/helpers");

// Create a task and allocate to user
exports.createTask = async (req, res) => {
  try {
    const { title, description, allocatedTo, allocatedBy, dueDate } = req.body;

    // Validation
    if (!title || !description || !allocatedTo || !allocatedBy) {
      return sendResponse(res, 400, "All fields are required");
    }

    if (!isValidId(allocatedTo) || !isValidId(allocatedBy)) {
      return sendResponse(res, 400, "Invalid user IDs");
    }

    // Check if users exist
    const assignedUser = await User.findById(allocatedTo);
    const assignerUser = await User.findById(allocatedBy);

    if (!assignedUser || !assignerUser) {
      return sendResponse(res, 404, "One or both users not found");
    }

    // Create task
    const task = new Task({
      title,
      description,
      allocatedTo,
      allocatedBy,
      dueDate,
      status: "todo",
    });

    await task.save();

    // Populate user details before sending response
    await task.populate(["allocatedBy", "allocatedTo"]);

    sendResponse(res, 201, "Task created successfully", task);
  } catch (error) {
    handleError(res, error);
  }
};

// Get all tasks for a specific user (assigned to them)
exports.getMyTasks = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return sendResponse(res, 400, "Invalid user ID");
    }

    const tasks = await Task.find({ allocatedTo: userId })
      .populate("allocatedBy", "name email")
      .populate("allocatedTo", "name email");

    sendResponse(res, 200, "Tasks fetched successfully", tasks);
  } catch (error) {
    handleError(res, error);
  }
};

// Get all tasks allocated by a specific user
exports.getTasksAllocatedByMe = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidId(userId)) {
      return sendResponse(res, 400, "Invalid user ID");
    }

    const tasks = await Task.find({ allocatedBy: userId })
      .populate("allocatedBy", "name email")
      .populate("allocatedTo", "name email");

    sendResponse(res, 200, "Tasks allocated by you", tasks);
  } catch (error) {
    handleError(res, error);
  }
};

// Update task status
exports.updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!isValidId(taskId)) {
      return sendResponse(res, 400, "Invalid task ID");
    }

    if (!["todo", "progress", "done"].includes(status)) {
      return sendResponse(res, 400, "Invalid status. Must be todo, progress, or done");
    }

    const task = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true }
    ).populate(["allocatedBy", "allocatedTo"]);

    if (!task) {
      return sendResponse(res, 404, "Task not found");
    }

    sendResponse(res, 200, "Task status updated successfully", task);
  } catch (error) {
    handleError(res, error);
  }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!isValidId(taskId)) {
      return sendResponse(res, 400, "Invalid task ID");
    }

    const task = await Task.findById(taskId)
      .populate("allocatedBy", "name email")
      .populate("allocatedTo", "name email");

    if (!task) {
      return sendResponse(res, 404, "Task not found");
    }

    sendResponse(res, 200, "Task fetched successfully", task);
  } catch (error) {
    handleError(res, error);
  }
};

// Get all tasks (for admin/dashboard)
exports.getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("allocatedBy", "name email")
      .populate("allocatedTo", "name email")
      .sort({ createdAt: -1 });

    sendResponse(res, 200, "All tasks fetched successfully", tasks);
  } catch (error) {
    handleError(res, error);
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!isValidId(taskId)) {
      return sendResponse(res, 400, "Invalid task ID");
    }

    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
      return sendResponse(res, 404, "Task not found");
    }

    sendResponse(res, 200, "Task deleted successfully", null);
  } catch (error) {
    handleError(res, error);
  }
};
