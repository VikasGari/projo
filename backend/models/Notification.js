const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  type: { 
    type: String, 
    enum: [
      "task_assigned", 
      "task_status_changed", 
      "event_reminder", 
      "friend_request", 
      "team_invite", 
      "project_invite",
      "new_message",
      "task_due_soon",
      "project_update",
      "team_update"
    ], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 2592000 // 30 days in seconds - auto delete old notifications
  },
  // Reference to related entities
  relatedTask: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Task" 
  },
  relatedProject: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Project" 
  },
  relatedTeam: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Team" 
  },
  relatedEvent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Event" 
  },
  relatedUser: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  },
  // Additional metadata for more context
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  // Reference URL to redirect user
  link: {
    type: String
  }
});

// Index for efficient user notification queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Static method to create new notification
notificationSchema.statics.createNotification = async function(notificationData) {
  try {
    const notification = await this.create(notificationData);
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

// Static method to mark notifications as read
notificationSchema.statics.markAsRead = async function(userId, notificationIds = null) {
  try {
    const query = { recipient: userId };
    if (notificationIds && notificationIds.length > 0) {
      query._id = { $in: notificationIds };
    }
    
    await this.updateMany(query, { $set: { read: true } });
    return true;
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    throw error;
  }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    return await this.countDocuments({ recipient: userId, read: false });
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    throw error;
  }
};

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification; 