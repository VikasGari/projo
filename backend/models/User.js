const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true
  },
  handle: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    match: /^[a-zA-Z0-9_]+$/
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
  },
  googleId: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  profile_image: { type: String },
  bio: { type: String, maxLength: 500 },

  // Friend-related fields
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  friendRequestsReceived: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    requestedAt: { type: Date, default: Date.now }
  }],
  friendRequestsSent: [{
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    requestedAt: { type: Date, default: Date.now }
  }],

  // Team-related fields
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
  teamJoinRequests: [{
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    requestedAt: { type: Date, default: Date.now }
  }],

  // Project-related fields
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  projectJoinRequests: [{
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    requestedAt: { type: Date, default: Date.now }
  }],

  // Chat-related fields
  friendChats: [{ type: mongoose.Schema.Types.ObjectId, ref: "FriendChat" }],
  teamChats: [{ type: mongoose.Schema.Types.ObjectId, ref: "TeamChat" }],
  projectChats: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProjectChat" }],

  // Settings
  settings: {
    emailNotifications: { type: Boolean, default: true },
    friendRequestNotifications: { type: Boolean, default: true },
    teamJoinRequestNotifications: { type: Boolean, default: true },
    projectJoinRequestNotifications: { type: Boolean, default: true }
  },

  // Dashboard fields
  dashboard: {
    activeToday: {
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
      lastUpdate: { type: Date },
    },
    weeklyActivity: [{
      day: String,
      hours: Number,
      date: String
    }],
    miniNote: {
      type: String,
      default: ''
    },
    pinnedProjects: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    }]
  },

  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Check if handle is available
userSchema.statics.isHandleAvailable = async function(handle) {
  const user = await this.findOne({ handle });
  return !user;
};

// Get common connections with another user
userSchema.methods.getCommonConnections = async function(otherUserId) {
  const otherUser = await this.model('User').findById(otherUserId);
  if (!otherUser) return null;

  const commonTeams = this.teams.filter(teamId => 
    otherUser.teams.some(otherTeamId => otherTeamId.toString() === teamId.toString())
  );

  const commonProjects = this.projects.filter(projectId => 
    otherUser.projects.some(otherProjectId => otherProjectId.toString() === projectId.toString())
  );

  return {
    commonTeams,
    commonProjects,
    isFriend: this.friends.some(friendId => friendId.toString() === otherUserId.toString())
  };
};

module.exports = mongoose.model("User", userSchema);
