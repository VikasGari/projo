const express = require("express");
const router = express.Router();
const {
  getUserNotifications,
  markNotificationsAsRead,
  deleteNotifications,
  getUnreadCount,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");

// Base route: /api/notifications

// Get user notifications with pagination
router.get("/", protect, getUserNotifications);

// Get unread notification count
router.get("/unread-count", protect, getUnreadCount);

// Mark notifications as read
router.patch("/read", protect, markNotificationsAsRead);

// Delete notifications
router.delete("/", protect, deleteNotifications);

module.exports = router; 