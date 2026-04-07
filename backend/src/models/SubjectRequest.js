const mongoose = require('mongoose');

const subjectRequestSchema = new mongoose.Schema({
  requestType: {
    type: String,
    enum: ['add', 'modify', 'remove'],
    required: true
  },
  // For add/modify requests
  subjectData: {
    name: String,
    code: String,
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    semester: Number,
    credits: Number,
    type: { type: String, enum: ['theory', 'lab'] }
  },
  // For modify/remove requests - reference to existing subject
  existingSubject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  },
  reason: {
    type: String,
    required: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewRemarks: String
}, {
  timestamps: true
});

module.exports = mongoose.model('SubjectRequest', subjectRequestSchema);
