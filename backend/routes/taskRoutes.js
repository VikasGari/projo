const express = require("express");
const {
    getTaskById,
    createTask,
    updateTaskStatus,
    assignTask,
    unassignTask,
    deleteTask
} = require("../controllers/taskController");

const router = express.Router();

// Task CRUD routes
router.get("/:id", getTaskById);
router.post("/", createTask);
router.patch("/:id/status", updateTaskStatus);
router.post("/assign", assignTask);
router.post("/unassign", unassignTask);
router.delete("/:id", deleteTask);

module.exports = router;
