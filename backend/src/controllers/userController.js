const User = require('../models/User');
const SubjectAllocation = require('../models/SubjectAllocation');
const InstitutionSettings = require('../models/InstitutionSettings');
const { ROLES } = require('../config/constants');

/**
 * List users with filters
 * @route GET /api/users
 * @access Admin, HOD (own department only)
 */
exports.listUsers = async (req, res, next) => {
  try {
    const { role, department, program, semester, section, search, page = 1, limit = 50 } = req.query;
    
    const filter = { isActive: true };
    
    // Role filter
    if (role) filter.role = role;
    
    // Department filter (HOD can only see their department)
    if (req.user.role === ROLES.HOD) {
      filter.department = req.user.department._id;
    } else if (department) {
      filter.department = department;
    }
    
    // Student-specific filters
    if (program) filter['studentFields.program'] = program;
    if (semester) filter['studentFields.currentSemester'] = parseInt(semester);
    if (section) filter['studentFields.section'] = section.toUpperCase();
    
    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'studentFields.rollNumber': { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('department', 'name code')
        .populate('studentFields.program', 'name code')
        .populate('studentFields.mentor', 'name email')
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get mentees for current staff
 * @route GET /api/users/mentees
 * @access Staff
 */
exports.getMentees = async (req, res, next) => {
  try {
    const mentees = await User.find({
      role: ROLES.STUDENT,
      'studentFields.mentor': req.user._id,
      isActive: true
    })
      .populate('department', 'name code')
      .populate('studentFields.program', 'name code')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: mentees,
      count: mentees.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get students for staff's allocated subjects
 * @route GET /api/users/students-by-allocation
 * @access Staff
 */
exports.getStudentsByAllocation = async (req, res, next) => {
  try {
    const settings = await InstitutionSettings.getSettings();
    
    // Get staff's allocations
    const allocations = await SubjectAllocation.find({
      faculty: req.user._id,
      academicYear: settings.currentAcademicYear,
      isActive: true
    }).populate('subject');
    
    if (allocations.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No subject allocations found'
      });
    }
    
    // Get unique program-semester-section combinations
    const filters = allocations.map(a => ({
      'studentFields.program': a.subject.program,
      'studentFields.currentSemester': a.subject.semester,
      'studentFields.section': a.section
    }));
    
    const students = await User.find({
      role: ROLES.STUDENT,
      isActive: true,
      $or: filters
    })
      .populate('department', 'name code')
      .populate('studentFields.program', 'name code')
      .sort({ 'studentFields.rollNumber': 1 });
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 * @access Admin, HOD (own dept), Self
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', 'name code')
      .populate('studentFields.program', 'name code')
      .populate('studentFields.mentor', 'name email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // HOD can only see users in their department
    if (req.user.role === ROLES.HOD && !req.isOwner) {
      if (!user.department || user.department._id.toString() !== req.user.department._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. User not in your department.'
        });
      }
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 * @access Admin
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { email, name, role, department, studentFields, staffFields, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields
    if (email) user.email = email;
    if (name) user.name = name;
    if (role) user.role = role;
    if (department !== undefined) user.department = department || null;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    
    if (studentFields) {
      user.studentFields = { ...user.studentFields?.toObject(), ...studentFields };
    }
    if (staffFields) {
      user.staffFields = { ...user.staffFields?.toObject(), ...staffFields };
    }
    
    await user.save();
    
    const updatedUser = await User.findById(user._id)
      .populate('department', 'name code')
      .populate('studentFields.program', 'name code')
      .populate('studentFields.mentor', 'name email');
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate user (soft delete)
 * @route DELETE /api/users/:id
 * @access Admin
 */
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent deactivating yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }
    
    user.isActive = false;
    await user.save();
    
    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign mentor to student
 * @route PUT /api/users/:id/mentor
 * @access Admin
 */
exports.assignMentor = async (req, res, next) => {
  try {
    const { mentorId } = req.body;
    
    // Verify student exists
    const student = await User.findById(req.params.id);
    if (!student || student.role !== ROLES.STUDENT) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Verify mentor exists and is staff
    const mentor = await User.findById(mentorId);
    if (!mentor || ![ROLES.STAFF, ROLES.HOD].includes(mentor.role)) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found or is not a staff member'
      });
    }
    
    // Assign mentor
    student.studentFields = student.studentFields || {};
    student.studentFields.mentor = mentorId;
    await student.save();
    
    const updatedStudent = await User.findById(student._id)
      .populate('department', 'name code')
      .populate('studentFields.program', 'name code')
      .populate('studentFields.mentor', 'name email');
    
    res.json({
      success: true,
      message: 'Mentor assigned successfully',
      data: updatedStudent
    });
  } catch (error) {
    next(error);
  }
};
