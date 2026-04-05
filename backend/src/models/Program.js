const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Program name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Program code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  totalSemesters: {
    type: Number,
    default: 8,
    min: 1,
    max: 12
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for department queries
programSchema.index({ department: 1 });

module.exports = mongoose.model('Program', programSchema);
