const express = require("express");
const {
    getTeamChat,
    startTeamChat,
    sendTeamMessage,
    markTeamMessagesAsRead,
    deleteTeamChat
} = require("../controllers/teamChatController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Get team chat messages
router.get("/:teamId", protect, getTeamChat);

// Start a new team chat
router.post("/start", protect, startTeamChat);

// Send a message
router.post("/message", protect, sendTeamMessage);

// Mark messages as read
router.patch("/read", protect, markTeamMessagesAsRead);

// Delete chat (admin only)
router.delete("/:teamId", protect, deleteTeamChat);

module.exports = router;
