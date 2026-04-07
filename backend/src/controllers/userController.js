const User = require('../models/User');
const SubjectAllocation = require('../models/SubjectAllocation');
const InstitutionSettings = require('../models/InstitutionSettings');
const { ROLES } = require('../config/constants');

/**
 * Create a new user
 * @route POST /api/users
 * @access Admin (HOD only), HOD (staff/students in own dept)
 */
exports.createUser = async (req, res, next) => {
  try {
    const { email, password, name, role, department, studentFields, staffFields } = req.body;
    
    // RBAC: Admin can only create HODs
    if (req.user.role === ROLES.ADMIN) {
      if (role !== ROLES.HOD) {
        return res.status(403).json({
          success: false,
          message: 'Admin can only create HOD users. Staff and students should be created by their department HOD.'
        });
      }
      // Department is required for HODs
      if (!department) {
        return res.status(400).json({
          success: false,
          message: 'Department is required for HOD users'
        });
      }
    }
    
    // RBAC: HOD can only create staff/students in their own department
    if (req.user.role === ROLES.HOD) {
      // Cannot create HODs or admins
      if ([ROLES.ADMIN, ROLES.HOD].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'HOD cannot create administrators or other HODs'
        });
      }
      
      // Must be in HOD's department
      const hodDeptId = req.user.department._id ? req.user.department._id.toString() : req.user.department.toString();
      if (!department || department !== hodDeptId) {
        return res.status(403).json({
          success: false,
          message: 'HOD can only create users in their own department'
        });
      }
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create user
    const userData = {
      email,
      password,
      name,
      role,
      department: department || null
    };
    
    // Add role-specific fields
    if (role === ROLES.STUDENT && studentFields) {
      userData.studentFields = studentFields;
    }
    if ([ROLES.STAFF, ROLES.HOD].includes(role) && staffFields) {
      userData.staffFields = staffFields;
    }
    
    const user = await User.create(userData);
    
    // Populate department for response
    await user.populate('department', 'name code');
    if (role === ROLES.STUDENT) {
      await user.populate('studentFields.program', 'name code');
    }
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List users with filters
 * @route GET /api/users
 * @access Admin (HOD only), HOD (staff/students in dept only)
 */
exports.listUsers = async (req, res, next) => {
  try {
    const { role, department, program, semester, section, search, page = 1, limit = 50 } = req.query;
    
    const filter = { isActive: true };
    
    // ADMIN: Can only manage HODs
    if (req.user.role === ROLES.ADMIN) {
      // Admin can only see HODs, or specific department filter for overview
      if (role && role !== ROLES.HOD) {
        return res.status(403).json({
          success: false,
          message: 'Admin can only manage HODs. Staff and students are managed by HODs.'
        });
      }
      filter.role = ROLES.HOD;
    }
    
    // HOD: Can manage staff and students in their department only
    if (req.user.role === ROLES.HOD) {
      filter.department = req.user.department._id;
      // HOD cannot manage other HODs or admins
      if (role) {
        if ([ROLES.ADMIN, ROLES.HOD].includes(role)) {
          return res.status(403).json({
            success: false,
            message: 'HOD cannot manage administrators or other HODs'
          });
        }
        filter.role = role;
      } else {
        // Default: show staff and students only
        filter.role = { $in: [ROLES.STAFF, ROLES.STUDENT] };
      }
    }
    
    // Additional filters
    if (department && req.user.role === ROLES.ADMIN) {
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
 * Get students by class (program, semester, section)
 * @route GET /api/users/students/by-class
 * @access Staff, HOD, Admin
 */
exports.getStudentsByClass = async (req, res, next) => {
  try {
    let { program, semester, section } = req.query;
    
    if (!program || !semester || !section) {
      return res.status(400).json({
        success: false,
        message: 'Program, semester, and section are required'
      });
    }
    
    // Handle nested object from query params (program[_id]=xxx)
    let programId = program;
    if (typeof program === 'object' && program._id) {
      programId = program._id;
    }
    
    const filter = {
      role: ROLES.STUDENT,
      isActive: true,
      'studentFields.program': programId,
      'studentFields.currentSemester': parseInt(semester),
      'studentFields.section': section.toUpperCase()
    };
    
    const students = await User.find(filter)
      .populate('department', 'name code')
      .populate('studentFields.program', 'name code')
      .populate('studentFields.mentor', 'name email')
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
 * @access Admin (HOD only), HOD (staff/students in dept)
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
    
    // ADMIN: Can only update HODs
    if (req.user.role === ROLES.ADMIN) {
      if (user.role !== ROLES.HOD && role !== ROLES.HOD) {
        return res.status(403).json({
          success: false,
          message: 'Admin can only manage HODs. Staff and students are managed by HODs.'
        });
      }
    }
    
    // HOD: Can only update staff and students in their department
    if (req.user.role === ROLES.HOD) {
      // Check if user is in HOD's department
      if (!user.department || user.department.toString() !== req.user.department._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only manage users in your department'
        });
      }
      
      // HOD cannot update HODs or admins
      if ([ROLES.ADMIN, ROLES.HOD].includes(user.role) || [ROLES.ADMIN, ROLES.HOD].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'HOD cannot manage administrators or other HODs'
        });
      }
      
      // HOD cannot change department
      if (department && department !== user.department.toString()) {
        return res.status(403).json({
          success: false,
          message: 'HOD cannot transfer users to other departments'
        });
      }
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
 * @access Admin (HOD only), HOD (staff/students in dept)
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
    
    // ADMIN: Can only deactivate HODs
    if (req.user.role === ROLES.ADMIN) {
      if (user.role !== ROLES.HOD) {
        return res.status(403).json({
          success: false,
          message: 'Admin can only manage HODs. Staff and students are managed by HODs.'
        });
      }
    }
    
    // HOD: Can only deactivate staff and students in their department
    if (req.user.role === ROLES.HOD) {
      if (!user.department || user.department.toString() !== req.user.department._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only manage users in your department'
        });
      }
      
      if ([ROLES.ADMIN, ROLES.HOD].includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: 'HOD cannot deactivate administrators or other HODs'
        });
      }
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
 * @access HOD (own dept students only)
 */
exports.assignMentor = async (req, res, next) => {
  try {
    const { mentorId } = req.body;
    
    // Verify student exists
    const student = await User.findById(req.params.id).populate('department');
    if (!student || student.role !== ROLES.STUDENT) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // HOD can only assign mentors to students in their department
    if (req.user.role === ROLES.HOD) {
      if (!student.department || student.department._id.toString() !== req.user.department._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only assign mentors to students in your department'
        });
      }
    }
    
    // Verify mentor exists and is staff in the same department
    const mentor = await User.findById(mentorId).populate('department');
    if (!mentor || ![ROLES.STAFF, ROLES.HOD].includes(mentor.role)) {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found or is not a staff member'
      });
    }
    
    // Mentor should be in the same department
    if (!mentor.department || mentor.department._id.toString() !== student.department._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Mentor must be from the same department as the student'
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
