const fs = require('fs');
const Activity = require('../models/Activity');
const User = require('../models/User');
const { ACTIVITY_STATUS } = require('../config/constants');
const { ROLES } = require('../config/constants');

/**
 * Submit new activity
 * @route POST /api/activities
 * @access Student
 */
exports.submitActivity = async (req, res, next) => {
  try {
    const { category, title, description, date, duration, organizer } = req.body;
    
    // Check if student has a mentor assigned
    const student = await User.findById(req.user._id);
    if (!student.studentFields?.mentor) {
      // Clean up uploaded files if present
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          try { fs.unlinkSync(file.path); } catch (e) {}
        });
      }
      return res.status(400).json({
        success: false,
        message: 'You must have a mentor assigned before submitting activities. Contact admin.'
      });
    }
    
    // Handle multiple certificate files
    const certificates = req.files ? req.files.map(file => file.path) : [];
    
    const activity = await Activity.create({
      student: req.user._id,
      category,
      title,
      description,
      date: date || new Date(),
      duration,
      organizer,
      certificates,
      status: ACTIVITY_STATUS.PENDING
    });
    
    const populatedActivity = await Activity.findById(activity._id)
      .populate('category', 'name')
      .populate('student', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Activity submitted successfully. Awaiting verification from your mentor.',
      data: populatedActivity
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        try { fs.unlinkSync(file.path); } catch (e) {}
      });
    }
    next(error);
  }
};

/**
 * Get student's own activities
 * @route GET /api/activities/my-activities
 * @access Student
 */
exports.getMyActivities = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const filter = { student: req.user._id };
    if (status) filter.status = status;
    
    const activities = await Activity.find(filter)
      .populate('category', 'name')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get activities pending verification for mentor
 * @route GET /api/activities/pending-verification
 * @access Staff (mentor)
 */
exports.getPendingVerification = async (req, res, next) => {
  try {
    // Get all mentees of this staff
    const mentees = await User.find({
      role: ROLES.STUDENT,
      'studentFields.mentor': req.user._id,
      isActive: true
    }).select('_id');
    
    const menteeIds = mentees.map(m => m._id);
    
    const activities = await Activity.find({
      student: { $in: menteeIds },
      status: ACTIVITY_STATUS.PENDING
    })
      .populate('student', 'name email studentFields.rollNumber')
      .populate('category', 'name')
      .sort({ createdAt: 1 }); // Oldest first
    
    res.json({
      success: true,
      data: activities,
      count: activities.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify or reject activity
 * @route PUT /api/activities/:id/verify
 * @access Staff (mentor)
 */
exports.verifyActivity = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    
    const activity = await Activity.findById(req.params.id)
      .populate('student', 'name studentFields.mentor');
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Verify that the current user is the student's mentor
    if (activity.student.studentFields?.mentor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not the mentor of this student'
      });
    }
    
    // Can only verify pending activities
    if (activity.status !== ACTIVITY_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Activity is already ${activity.status}`
      });
    }
    
    activity.status = status;
    activity.verifiedBy = req.user._id;
    activity.verifiedAt = new Date();
    
    if (status === ACTIVITY_STATUS.REJECTED) {
      activity.rejectionReason = rejectionReason;
    }
    
    await activity.save();
    
    const updatedActivity = await Activity.findById(activity._id)
      .populate('category', 'name')
      .populate('student', 'name email')
      .populate('verifiedBy', 'name');
    
    res.json({
      success: true,
      message: `Activity ${status} successfully`,
      data: updatedActivity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resubmit rejected activity
 * @route PUT /api/activities/:id
 * @access Student (owner)
 */
exports.resubmitActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Verify ownership
    if (activity.student.toString() !== req.user._id.toString()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own activities'
      });
    }
    
    // Can only resubmit rejected activities
    if (activity.status !== ACTIVITY_STATUS.REJECTED) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Only rejected activities can be resubmitted'
      });
    }
    
    // Update fields
    const { title, description, activityDate, category } = req.body;
    if (title) activity.title = title;
    if (description !== undefined) activity.description = description;
    if (activityDate) activity.activityDate = activityDate;
    if (category) activity.category = category;
    
    // Update certificate if new file uploaded
    if (req.file) {
      // Delete old file
      if (activity.certificateFile && fs.existsSync(activity.certificateFile)) {
        fs.unlinkSync(activity.certificateFile);
      }
      activity.certificateFile = req.file.path;
    }
    
    // Reset status to pending
    activity.status = ACTIVITY_STATUS.PENDING;
    activity.verifiedBy = null;
    activity.verifiedAt = null;
    activity.rejectionReason = null;
    
    await activity.save();
    
    const updatedActivity = await Activity.findById(activity._id)
      .populate('category', 'name');
    
    res.json({
      success: true,
      message: 'Activity resubmitted for verification',
      data: updatedActivity
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    next(error);
  }
};

/**
 * Get verified activities (portfolio) for a student
 * @route GET /api/activities/portfolio/:studentId
 * @access Student (self), Staff (mentor), HOD, Admin
 */
exports.getPortfolio = async (req, res, next) => {
  try {
    const studentId = req.params.studentId;
    
    // Staff can only see their mentees' portfolio
    if (req.user.role === ROLES.STAFF && !req.isOwner) {
      const student = await User.findById(studentId);
      if (!student || student.studentFields?.mentor?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your mentees\' portfolios'
        });
      }
    }
    
    const student = await User.findById(studentId)
      .populate('department', 'name')
      .populate('studentFields.program', 'name code');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    const activities = await Activity.find({
      student: studentId,
      status: ACTIVITY_STATUS.VERIFIED
    })
      .populate('category', 'name')
      .populate('verifiedBy', 'name')
      .sort({ activityDate: -1 });
    
    // Group by category
    const grouped = activities.reduce((acc, activity) => {
      const cat = activity.category.name;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(activity);
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        student: {
          name: student.name,
          email: student.email,
          rollNumber: student.studentFields?.rollNumber,
          program: student.studentFields?.program,
          semester: student.studentFields?.currentSemester,
          department: student.department
        },
        totalActivities: activities.length,
        activities,
        byCategory: grouped
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all activities in department
 * @route GET /api/activities/department
 * @access HOD
 */
exports.getDepartmentActivities = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    
    // Get all students in HOD's department
    const students = await User.find({
      role: ROLES.STUDENT,
      department: req.user.department._id,
      isActive: true
    }).select('_id');
    
    const studentIds = students.map(s => s._id);
    
    const filter = { student: { $in: studentIds } };
    if (status) filter.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate('student', 'name email studentFields.rollNumber')
        .populate('category', 'name')
        .populate('verifiedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Activity.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: activities,
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
 * Get all activities (admin)
 * @route GET /api/activities/all
 * @access Admin
 */
exports.getAllActivities = async (req, res, next) => {
  try {
    const { status, department, page = 1, limit = 50 } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    
    // Filter by department if specified
    if (department) {
      const students = await User.find({
        role: ROLES.STUDENT,
        department,
        isActive: true
      }).select('_id');
      filter.student = { $in: students.map(s => s._id) };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate('student', 'name email studentFields.rollNumber department')
        .populate('category', 'name')
        .populate('verifiedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Activity.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      data: activities,
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
 * Get activity by ID
 * @route GET /api/activities/:id
 * @access Owner, Mentor, HOD, Admin
 */
exports.getActivityById = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('student', 'name email studentFields.rollNumber studentFields.mentor department')
      .populate('category', 'name')
      .populate('verifiedBy', 'name');
    
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }
    
    // Check access
    const isOwner = activity.student._id.toString() === req.user._id.toString();
    const isMentor = activity.student.studentFields?.mentor?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isHOD = req.user.role === ROLES.HOD && 
      activity.student.department?.toString() === req.user.department?._id.toString();
    
    if (!isOwner && !isMentor && !isAdmin && !isHOD) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current student's portfolio (verified activities)
 * @route GET /api/activities/my-portfolio
 * @access Student
 */
exports.getMyPortfolio = async (req, res, next) => {
  try {
    const Activity = require('../models/Activity');
    const { ACTIVITY_STATUS } = require('../config/constants');
    
    const activities = await Activity.find({
      student: req.user._id,
      status: ACTIVITY_STATUS.VERIFIED
    })
    .populate('category', 'name')
    .sort({ activityDate: -1 });
    
    res.json({
      success: true,
      count: activities.length,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};
