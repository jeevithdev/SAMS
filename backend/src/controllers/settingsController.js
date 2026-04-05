const InstitutionSettings = require('../models/InstitutionSettings');

/**
 * Get institution settings
 * @route GET /api/settings
 * @access All authenticated
 */
exports.getSettings = async (req, res, next) => {
  try {
    const settings = await InstitutionSettings.getSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update institution settings
 * @route PUT /api/settings
 * @access Admin
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const {
      attendanceEditWindowHours,
      defaulterThreshold,
      marksConfig,
      currentAcademicYear,
      institutionName
    } = req.body;
    
    const settings = await InstitutionSettings.getSettings();
    
    if (attendanceEditWindowHours !== undefined) {
      settings.attendanceEditWindowHours = attendanceEditWindowHours;
    }
    if (defaulterThreshold !== undefined) {
      settings.defaulterThreshold = defaulterThreshold;
    }
    if (marksConfig) {
      settings.marksConfig = { ...settings.marksConfig.toObject(), ...marksConfig };
    }
    if (currentAcademicYear) {
      settings.currentAcademicYear = currentAcademicYear;
    }
    if (institutionName) {
      settings.institutionName = institutionName;
    }
    
    await settings.save();
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update attendance-to-marks slabs
 * @route PUT /api/settings/attendance-slabs
 * @access Admin
 */
exports.updateAttendanceSlabs = async (req, res, next) => {
  try {
    const { slabs } = req.body;
    
    // Validate slabs are properly ordered and don't overlap
    const sortedSlabs = [...slabs].sort((a, b) => b.minPercentage - a.minPercentage);
    
    // Check that the lowest slab starts at 0
    const lowestSlab = sortedSlabs[sortedSlabs.length - 1];
    if (lowestSlab.minPercentage > 0) {
      return res.status(400).json({
        success: false,
        message: 'Must have a slab starting at 0% to cover all cases'
      });
    }
    
    const settings = await InstitutionSettings.getSettings();
    settings.attendanceMarksSlabs = sortedSlabs;
    await settings.save();
    
    res.json({
      success: true,
      message: 'Attendance slabs updated successfully',
      data: settings.attendanceMarksSlabs
    });
  } catch (error) {
    next(error);
  }
};
