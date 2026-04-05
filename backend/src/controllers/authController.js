const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Admin only
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, name, role, department, studentFields, staffFields } = req.body;
    
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
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user and return token
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password').populate('department');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Contact administrator.'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Remove password from response
    const userResponse = user.toJSON();
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Authenticated
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('department')
      .populate('studentFields.program')
      .populate('studentFields.mentor', 'name email');
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * @route PUT /api/auth/password
 * @access Authenticated
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create initial admin (only works if no admin exists)
 * @route POST /api/auth/setup-admin
 * @access Public (one-time setup)
 */
exports.setupAdmin = async (req, res, next) => {
  try {
    // Check if any admin exists
    const adminExists = await User.findOne({ role: ROLES.ADMIN });
    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists. Use login instead.'
      });
    }
    
    const { email, password, name } = req.body;
    
    // Create admin
    const admin = await User.create({
      email,
      password,
      name,
      role: ROLES.ADMIN
    });
    
    const token = generateToken(admin._id);
    
    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        user: admin,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};
