const SubjectAllocation = require('../models/SubjectAllocation');
const Subject = require('../models/Subject');
const User = require('../models/User');
const InstitutionSettings = require('../models/InstitutionSettings');
const { ROLES } = require('../config/constants');

/**
 * Create subject allocation (assign subject to faculty)
 * @route POST /api/allocations
 * @access Admin
 */
exports.createAllocation = async (req, res, next) => {
  try {
    const { faculty, subject, section, academicYear } = req.body;
    
    // Verify faculty exists and is staff
    const facultyUser = await User.findById(faculty);
    if (!facultyUser || ![ROLES.STAFF, ROLES.HOD].includes(facultyUser.role)) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found or is not a staff member'
      });
    }
    
    // Verify subject exists
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    
    // Get current academic year if not provided
    const settings = await InstitutionSettings.getSettings();
    const year = academicYear || settings.currentAcademicYear;
    
    // Check if allocation already exists
    const existingAllocation = await SubjectAllocation.findOne({
      faculty,
      subject,
      academicYear: year,
      section: section.toUpperCase()
    });
    
    if (existingAllocation) {
      return res.status(400).json({
        success: false,
        message: 'This allocation already exists'
      });
    }
    
    const allocation = await SubjectAllocation.create({
      faculty,
      subject,
      academicYear: year,
      section: section.toUpperCase()
    });
    
    const populatedAllocation = await SubjectAllocation.findById(allocation._id)
      .populate('faculty', 'name email')
      .populate({
        path: 'subject',
        populate: { path: 'program', select: 'name code' }
      });
    
    res.status(201).json({
      success: true,
      message: 'Subject allocated to faculty successfully',
      data: populatedAllocation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List allocations with filters
 * @route GET /api/allocations
 * @access Admin, HOD
 */
exports.listAllocations = async (req, res, next) => {
  try {
    const { faculty, subject, academicYear, department } = req.query;
    
    const settings = await InstitutionSettings.getSettings();
    
    const filter = { isActive: true };
    if (faculty) filter.faculty = faculty;
    if (subject) filter.subject = subject;
    filter.academicYear = academicYear || settings.currentAcademicYear;
    
    let allocations = await SubjectAllocation.find(filter)
      .populate('faculty', 'name email department')
      .populate({
        path: 'subject',
        populate: { path: 'program', select: 'name code department' }
      })
      .sort({ 'subject.semester': 1 });
    
    // HOD: filter to their department only
    if (req.user.role === ROLES.HOD && req.user.department) {
      allocations = allocations.filter(a => 
        a.subject.program.department.toString() === req.user.department._id.toString()
      );
    }
    
    // Filter by department if specified
    if (department) {
      allocations = allocations.filter(a => 
        a.subject.program.department.toString() === department
      );
    }
    
    res.json({
      success: true,
      data: allocations,
      count: allocations.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current staff's allocations
 * @route GET /api/allocations/my-allocations
 * @access Staff
 */
exports.getMyAllocations = async (req, res, next) => {
  try {
    const settings = await InstitutionSettings.getSettings();
    
    const allocations = await SubjectAllocation.find({
      faculty: req.user._id,
      academicYear: settings.currentAcademicYear,
      isActive: true
    })
      .populate({
        path: 'subject',
        populate: { path: 'program', select: 'name code' }
      });
    
    res.json({
      success: true,
      data: allocations,
      count: allocations.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove allocation (soft delete)
 * @route DELETE /api/allocations/:id
 * @access Admin
 */
exports.deleteAllocation = async (req, res, next) => {
  try {
    const allocation = await SubjectAllocation.findById(req.params.id);
    if (!allocation) {
      return res.status(404).json({
        success: false,
        message: 'Allocation not found'
      });
    }
    
    allocation.isActive = false;
    await allocation.save();
    
    res.json({
      success: true,
      message: 'Allocation removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
