const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
NoteSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add method to check if user has access to the note
NoteSchema.methods.hasAccess = function(userId) {
  // If note is private, only the owner has access
  if (this.isPrivate) {
    return this.user.toString() === userId.toString();
  }
  
  // If note is public and associated with a project
  if (this.project) {
    // Project members can access public notes
    return true;
  }
  
  // If note is public and not associated with a project
  return true;
};

module.exports = mongoose.model('Note', NoteSchema); 