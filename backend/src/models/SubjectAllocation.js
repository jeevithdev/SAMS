const mongoose = require('mongoose');

const subjectAllocationSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Faculty is required']
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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure unique combination of faculty, subject, academic year, and section
subjectAllocationSchema.index(
  { faculty: 1, subject: 1, academicYear: 1, section: 1 },
  { unique: true }
);

// Index for faculty queries (staff sees their allocations)
subjectAllocationSchema.index({ faculty: 1, isActive: 1 });

// Index for subject queries
subjectAllocationSchema.index({ subject: 1, academicYear: 1 });

module.exports = mongoose.model('SubjectAllocation', subjectAllocationSchema);
