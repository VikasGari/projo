const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  tag: {
    type: String,
    trim: true,
    default: 'general'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create a compound index for efficient querying by user and date
eventSchema.index({ user: 1, date: 1 });

const Event = mongoose.model('Event', eventSchema);

module.exports = Event; 