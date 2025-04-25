const asyncHandler = require("express-async-handler");
const Notification = require("../models/Notification");

// @desc Get user notifications
// @route GET /api/notifications
// @access Private
const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const unreadOnly = req.query.unread === "true";
  
  const query = { recipient: userId };
  if (unreadOnly) {
    query.read = false;
  }
  
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("relatedUser", "name profile_image")
    .populate("relatedTask", "title status")
    .populate("relatedProject", "name")
    .populate("relatedTeam", "name")
    .populate("relatedEvent", "title date");
  
  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });
  
  res.json({ 
    notifications, 
    total, 
    unreadCount,
    currentPage: page,
    totalPages: Math.ceil(total / limit)
  });
});

// @desc Mark notifications as read
// @route PATCH /api/notifications/read
// @access Private
const markNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { all, notificationIds } = req.body;
  
  if (all) {
    await Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );
  } else if (notificationIds && notificationIds.length > 0) {
    await Notification.updateMany(
      { recipient: userId, _id: { $in: notificationIds } },
      { $set: { read: true } }
    );
  } else {
    return res.status(400).json({ message: "Missing parameters" });
  }
  
  const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });
  
  res.json({ success: true, unreadCount });
});

// @desc Delete notifications
// @route DELETE /api/notifications
// @access Private
const deleteNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { all, notificationIds } = req.body;
  
  if (all) {
    await Notification.deleteMany({ recipient: userId });
  } else if (notificationIds && notificationIds.length > 0) {
    await Notification.deleteMany({ recipient: userId, _id: { $in: notificationIds } });
  } else {
    return res.status(400).json({ message: "Missing parameters" });
  }
  
  res.json({ success: true });
});

// @desc Get unread notification count
// @route GET /api/notifications/unread-count
// @access Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const unreadCount = await Notification.countDocuments({ recipient: userId, read: false });
  
  res.json({ unreadCount });
});

// Helper function to create a notification (for internal use)
const createNotification = async (notificationData) => {
  try {
    return await Notification.createNotification(notificationData);
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

module.exports = {
  getUserNotifications,
  markNotificationsAsRead,
  deleteNotifications,
  getUnreadCount,
  createNotification
}; 