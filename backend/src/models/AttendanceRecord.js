const mongoose = require('mongoose');
const { ATTENDANCE_STATUS } = require('../config/constants');

const attendanceRecordSchema = new mongoose.Schema({
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  sessionNumber: {
    type: Number,
    required: [true, 'Session number is required'],
    min: 1,
    max: 10
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    uppercase: true,
    trim: true
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  
  // Attendance data
  records: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ATTENDANCE_STATUS),
      required: true
    },
    remarks: {
      type: String,
      trim: true
    }
  }],
  
  // Audit trail for edits
  editHistory: [{
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    editedAt: {
      type: Date,
      default: Date.now
    },
    previousRecords: [{
      student: mongoose.Schema.Types.ObjectId,
      status: String,
      remarks: String
    }],
    reason: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Unique constraint: one record per subject, date, session, section
attendanceRecordSchema.index(
  { subject: 1, date: 1, sessionNumber: 1, section: 1 },
  { unique: true }
);

// Index for queries
attendanceRecordSchema.index({ subject: 1, academicYear: 1 });
attendanceRecordSchema.index({ faculty: 1, date: 1 });
attendanceRecordSchema.index({ 'records.student': 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
