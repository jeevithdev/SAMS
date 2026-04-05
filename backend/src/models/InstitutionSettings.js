const mongoose = require('mongoose');
const { DEFAULT_SETTINGS } = require('../config/constants');

const institutionSettingsSchema = new mongoose.Schema({
  // Attendance settings
  attendanceEditWindowHours: {
    type: Number,
    default: DEFAULT_SETTINGS.attendanceEditWindowHours,
    min: 1,
    max: 168 // Max 7 days
  },
  defaulterThreshold: {
    type: Number,
    default: DEFAULT_SETTINGS.defaulterThreshold,
    min: 50,
    max: 100
  },
  
  // Marks configuration
  marksConfig: {
    ciaMaxMarks: {
      type: Number,
      default: DEFAULT_SETTINGS.marksConfig.ciaMaxMarks
    },
    assignmentMaxMarks: {
      type: Number,
      default: DEFAULT_SETTINGS.marksConfig.assignmentMaxMarks
    },
    labMaxMarks: {
      type: Number,
      default: DEFAULT_SETTINGS.marksConfig.labMaxMarks
    },
    attendanceMaxMarks: {
      type: Number,
      default: DEFAULT_SETTINGS.marksConfig.attendanceMaxMarks
    }
  },
  
  // Attendance-to-marks slab
  attendanceMarksSlabs: [{
    minPercentage: {
      type: Number,
      required: true
    },
    marks: {
      type: Number,
      required: true
    }
  }],
  
  // General settings
  currentAcademicYear: {
    type: String,
    default: DEFAULT_SETTINGS.currentAcademicYear
  },
  institutionName: {
    type: String,
    default: DEFAULT_SETTINGS.institutionName
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
institutionSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      attendanceMarksSlabs: DEFAULT_SETTINGS.attendanceMarksSlabs
    });
  }
  return settings;
};

module.exports = mongoose.model('InstitutionSettings', institutionSettingsSchema);
