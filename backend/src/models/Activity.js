const mongoose = require('mongoose');
const { ACTIVITY_STATUS } = require('../config/constants');

const activitySchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ActivityCategory',
    required: [true, 'Category is required']
  },
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Activity date is required']
  },
  duration: {
    type: String, // e.g., "3 days", "1 week"
    trim: true
  },
  organizer: {
    type: String,
    trim: true
  },
  certificates: [{
    type: String // File paths
  }],
  
  // Verification
  status: {
    type: String,
    enum: Object.values(ACTIVITY_STATUS),
    default: ACTIVITY_STATUS.PENDING
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for student queries
activitySchema.index({ student: 1, status: 1 });

// Index for mentor verification queries
activitySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
