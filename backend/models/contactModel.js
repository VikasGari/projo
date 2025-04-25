const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: null,
    validate: {
      validator: function(v) {
        return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  phone: {
    type: String,
    trim: true,
    default: null
  },
  mobile: {
    type: String,
    trim: true,
    default: null
  },
  company: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
      },
      message: 'Please enter a valid website URL'
    }
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Drop all indexes before creating new ones
contactSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      await this.constructor.collection.dropIndexes();
    } catch (error) {
      console.log('No indexes to drop or error dropping indexes:', error);
    }
  }
  next();
});

// Add method to find potential duplicates
contactSchema.statics.findPotentialDuplicates = async function(userId, contactData) {
  const query = {
    user: userId,
    $or: []
  };

  // Check for email duplicates if email is provided and not empty
  if (contactData.email && contactData.email.trim()) {
    query.$or.push({ email: contactData.email.trim().toLowerCase() });
  }

  // Check for phone duplicates if phone is provided and not empty
  if (contactData.phone && contactData.phone.trim()) {
    query.$or.push({ phone: contactData.phone.trim() });
  }

  // Check for mobile duplicates if mobile is provided and not empty
  if (contactData.mobile && contactData.mobile.trim()) {
    query.$or.push({ mobile: contactData.mobile.trim() });
  }

  // If no specific fields to check, return empty array
  if (query.$or.length === 0) {
    return [];
  }

  return this.find(query);
};

const Contact = mongoose.model('Contact', contactSchema);

module.exports = Contact; 