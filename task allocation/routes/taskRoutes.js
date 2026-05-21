const express = require("express");
const router = express.Router();
const {
  createTask,
  getMyTasks,
  getTasksAllocatedByMe,
  updateTaskStatus,
  getTaskById,
  getAllTasks,
  deleteTask,
} = require("../controllers/taskController");

// Create a new task
router.post("/", createTask);

// Get all tasks (admin)
router.get("/all", getAllTasks);

// Get tasks allocated to me
router.get("/my-tasks/:userId", getMyTasks);

// Get tasks allocated by me
router.get("/allocated-by/:userId", getTasksAllocatedByMe);

// Get specific task
router.get("/:taskId", getTaskById);

// Update task status
router.put("/:taskId", updateTaskStatus);

// Delete task
router.delete("/:taskId", deleteTask);

module.exports = router;
