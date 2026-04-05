const Department = require('../models/Department');
const User = require('../models/User');
const { ROLES } = require('../config/constants');

/**
 * Create department
 * @route POST /api/departments
 * @access Admin
 */
exports.createDepartment = async (req, res, next) => {
  try {
    const { name, code, hod } = req.body;
    
    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      hod: hod || null
    });
    
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List departments
 * @route GET /api/departments
 * @access All authenticated
 */
exports.listDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true })
      .populate('hod', 'name email')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: departments
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get department by ID
 * @route GET /api/departments/:id
 * @access All authenticated
 */
exports.getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('hod', 'name email');
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update department
 * @route PUT /api/departments/:id
 * @access Admin
 */
exports.updateDepartment = async (req, res, next) => {
  try {
    const { name, code, isActive } = req.body;
    
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    if (name) department.name = name;
    if (code) department.code = code.toUpperCase();
    if (typeof isActive === 'boolean') department.isActive = isActive;
    
    await department.save();
    
    res.json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign HOD to department
 * @route PUT /api/departments/:id/hod
 * @access Admin
 */
exports.assignHod = async (req, res, next) => {
  try {
    const { hodId } = req.body;
    
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }
    
    // Verify user exists and update their role to HOD
    const user = await User.findById(hodId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update user role to HOD and assign department
    user.role = ROLES.HOD;
    user.department = department._id;
    await user.save();
    
    // Assign HOD to department
    department.hod = hodId;
    await department.save();
    
    const updatedDepartment = await Department.findById(department._id)
      .populate('hod', 'name email');
    
    res.json({
      success: true,
      message: 'HOD assigned successfully',
      data: updatedDepartment
    });
  } catch (error) {
    next(error);
  }
};
