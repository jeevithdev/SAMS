const { ROLES } = require('../config/constants');

/**
 * Role-based access control middleware
 * Usage: authorize('admin', 'hod') or authorize(ROLES.ADMIN, ROLES.HOD)
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }
    
    next();
  };
};

/**
 * Check if user is accessing their own resource
 * Useful for routes like /users/:id where user can access their own profile
 */
const authorizeOwnerOrRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    const requestedId = req.params.id || req.params.studentId;
    const isOwner = requestedId && req.user._id.toString() === requestedId;
    const hasRole = allowedRoles.includes(req.user.role);
    
    if (!isOwner && !hasRole) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own data or need elevated privileges.'
      });
    }
    
    req.isOwner = isOwner;
    next();
  };
};

/**
 * Check if staff has allocation for the requested subject
 */
const authorizeSubjectAllocation = () => {
  return async (req, res, next) => {
    const SubjectAllocation = require('../models/SubjectAllocation');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Admin and HOD can access all subjects
    if ([ROLES.ADMIN, ROLES.HOD].includes(req.user.role)) {
      return next();
    }
    
    // For staff, check allocation
    if (req.user.role === ROLES.STAFF) {
      const subjectId = req.params.subjectId || req.body.subject;
      const section = req.params.section || req.body.section;
      
      if (!subjectId) {
        return res.status(400).json({
          success: false,
          message: 'Subject ID is required'
        });
      }
      
      const InstitutionSettings = require('../models/InstitutionSettings');
      const settings = await InstitutionSettings.getSettings();
      
      const query = {
        faculty: req.user._id,
        subject: subjectId,
        academicYear: settings.currentAcademicYear,
        isActive: true
      };
      
      // Add section filter if provided
      if (section) {
        query.section = section.toUpperCase();
      }
      
      const allocation = await SubjectAllocation.findOne(query);
      
      if (!allocation) {
        return res.status(403).json({
          success: false,
          message: 'You are not allocated to this subject'
        });
      }
      
      req.allocation = allocation;
      return next();
    }
    
    // Students cannot access this route
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  };
};

/**
 * Check if staff is the mentor of the requested student
 */
const authorizeMentor = () => {
  return async (req, res, next) => {
    const User = require('../models/User');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Admin and HOD can access all students
    if ([ROLES.ADMIN, ROLES.HOD].includes(req.user.role)) {
      return next();
    }
    
    // For staff, check if they are the mentor
    if (req.user.role === ROLES.STAFF) {
      const studentId = req.params.studentId || req.body.studentId;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }
      
      const student = await User.findById(studentId);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }
      
      const isMentor = student.studentFields?.mentor?.toString() === req.user._id.toString();
      
      if (!isMentor) {
        return res.status(403).json({
          success: false,
          message: 'You are not the mentor of this student'
        });
      }
      
      req.student = student;
      return next();
    }
    
    // Students can access their own data
    if (req.user.role === ROLES.STUDENT) {
      const studentId = req.params.studentId || req.body.studentId;
      if (studentId && req.user._id.toString() === studentId) {
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  };
};

/**
 * Check if HOD is accessing their own department's data
 */
const authorizeDepartment = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }
    
    // Admin can access all departments
    if (req.user.role === ROLES.ADMIN) {
      return next();
    }
    
    // HOD can only access their department
    if (req.user.role === ROLES.HOD) {
      const departmentId = req.params.departmentId || req.body.department;
      
      if (departmentId && req.user.department?._id.toString() !== departmentId) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own department data'
        });
      }
      
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  };
};

module.exports = {
  authorize,
  authorizeOwnerOrRoles,
  authorizeSubjectAllocation,
  authorizeMentor,
  authorizeDepartment,
  ROLES
};
