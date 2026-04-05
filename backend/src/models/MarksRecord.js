const mongoose = require('mongoose');

const marksRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    uppercase: true,
    trim: true
  },
  
  // Mark components
  ciaMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  assignmentMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  labMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  attendanceMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Consolidated total
  totalMarks: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Metadata
  enteredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Unique constraint: one record per student, subject, academic year
marksRecordSchema.index(
  { student: 1, subject: 1, academicYear: 1 },
  { unique: true }
);

// Index for subject queries
marksRecordSchema.index({ subject: 1, academicYear: 1, section: 1 });

// Pre-save middleware to calculate total
marksRecordSchema.pre('save', function(next) {
  this.totalMarks = (this.ciaMarks || 0) + 
                    (this.assignmentMarks || 0) + 
                    (this.labMarks || 0) + 
                    (this.attendanceMarks || 0);
  next();
});

module.exports = mongoose.model('MarksRecord', marksRecordSchema);
