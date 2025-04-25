const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
    getProjectChat,
    startProjectChat,
    sendProjectMessage,
    markProjectMessagesAsRead,
    deleteProjectChat
} = require("../controllers/projectChatController");

// Get project chat messages
router.get("/:projectId", protect, getProjectChat);

// Send a message
router.post("/message", protect, sendProjectMessage);

// Mark messages as read
router.patch("/read", protect, markProjectMessagesAsRead);

// Delete chat (admin only)
router.delete("/:projectId", protect, deleteProjectChat);

module.exports = router;
