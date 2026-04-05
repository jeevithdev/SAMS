const Program = require('../models/Program');
const { ROLES } = require('../config/constants');

/**
 * Create program
 * @route POST /api/programs
 * @access Admin
 */
exports.createProgram = async (req, res, next) => {
  try {
    const { name, code, department, totalSemesters } = req.body;
    
    const program = await Program.create({
      name,
      code: code.toUpperCase(),
      department,
      totalSemesters: totalSemesters || 8
    });
    
    const populatedProgram = await Program.findById(program._id)
      .populate('department', 'name code');
    
    res.status(201).json({
      success: true,
      message: 'Program created successfully',
      data: populatedProgram
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List programs
 * @route GET /api/programs
 * @access All authenticated
 */
exports.listPrograms = async (req, res, next) => {
  try {
    const { department } = req.query;
    
    const filter = { isActive: true };
    if (department) filter.department = department;
    
    // HOD can only see their department's programs
    if (req.user.role === ROLES.HOD && req.user.department) {
      filter.department = req.user.department._id;
    }
    
    const programs = await Program.find(filter)
      .populate('department', 'name code')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: programs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get program by ID
 * @route GET /api/programs/:id
 * @access All authenticated
 */
exports.getProgramById = async (req, res, next) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate('department', 'name code');
    
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }
    
    res.json({
      success: true,
      data: program
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update program
 * @route PUT /api/programs/:id
 * @access Admin
 */
exports.updateProgram = async (req, res, next) => {
  try {
    const { name, code, department, totalSemesters, isActive } = req.body;
    
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: 'Program not found'
      });
    }
    
    if (name) program.name = name;
    if (code) program.code = code.toUpperCase();
    if (department) program.department = department;
    if (totalSemesters) program.totalSemesters = totalSemesters;
    if (typeof isActive === 'boolean') program.isActive = isActive;
    
    await program.save();
    
    const updatedProgram = await Program.findById(program._id)
      .populate('department', 'name code');
    
    res.json({
      success: true,
      message: 'Program updated successfully',
      data: updatedProgram
    });
  } catch (error) {
    next(error);
  }
};
