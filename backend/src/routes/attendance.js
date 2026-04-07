const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authorize, authorizeOwnerOrRoles, authorizeSubjectAllocation, ROLES } = require('../middleware/rbac');
const { ATTENDANCE_STATUS } = require('../config/constants');
const attendanceController = require('../controllers/attendanceController');

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => e.msg)
    });
  }
  next();
};

// POST /api/attendance - Mark attendance (Staff with allocation)
router.post('/',
  protect,
  authorize(ROLES.STAFF, ROLES.HOD),
  [
    body('subject').notEmpty().withMessage('Subject is required'),
    body('section').trim().notEmpty().withMessage('Section is required'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('sessionNumber').isInt({ min: 1 }).withMessage('Valid session number is required'),
    body('records').isArray({ min: 1 }).withMessage('Attendance records are required'),
    body('records.*.student').notEmpty().withMessage('Student ID is required'),
    body('records.*.status').isIn(Object.values(ATTENDANCE_STATUS)).withMessage('Valid status is required')
  ],
  handleValidation,
  attendanceController.markAttendance
);

// PUT /api/attendance/:id - Edit attendance (Staff within time window, Admin anytime)
router.put('/:id',
  protect,
  authorize(ROLES.STAFF, ROLES.HOD, ROLES.ADMIN),
  [
    body('records').isArray({ min: 1 }).withMessage('Attendance records are required')
  ],
  handleValidation,
  attendanceController.editAttendance
);

// GET /api/attendance/my - Get current student's attendance (Student)
router.get('/my', protect, authorize(ROLES.STUDENT), attendanceController.getMyAttendance);

// GET /api/attendance/my-sessions - Get staff's marked sessions (Staff, HOD)
router.get('/my-sessions', protect, authorize(ROLES.STAFF, ROLES.HOD), attendanceController.getMySessions);

// GET /api/attendance/students/:subjectId/:section - Get students for marking (Staff with allocation)
router.get('/students/:subjectId/:section', protect, authorize(ROLES.STAFF, ROLES.HOD), attendanceController.getStudentsForMarking);

// GET /api/attendance/subject/:subjectId/:section - Get subject attendance records (Staff with allocation, HOD, Admin)
router.get('/subject/:subjectId/:section', 
  protect, 
  authorize(ROLES.STAFF, ROLES.HOD, ROLES.ADMIN), 
  attendanceController.getSubjectAttendance
);

// GET /api/attendance/subject/:subjectId - Get subject attendance records (without section, for backward compatibility)
router.get('/subject/:subjectId', 
  protect, 
  authorize(ROLES.STAFF, ROLES.HOD, ROLES.ADMIN), 
  attendanceController.getSubjectAttendance
);

// GET /api/attendance/student/:studentId - Get student's attendance (Owner, Mentor, HOD, Admin)
router.get('/student/:studentId', 
  protect, 
  authorizeOwnerOrRoles(ROLES.ADMIN, ROLES.HOD, ROLES.STAFF), 
  attendanceController.getStudentAttendance
);

// GET /api/attendance/percentage/:studentId/:subjectId - Get attendance percentage (Authenticated)
router.get('/percentage/:studentId/:subjectId', protect, attendanceController.getAttendancePercentage);

// GET /api/attendance/defaulters - Get defaulters (Staff for allocations, HOD for department, Admin for all)
router.get('/defaulters', protect, authorize(ROLES.STAFF, ROLES.HOD, ROLES.ADMIN), attendanceController.getDefaulters);

// GET /api/attendance/department-summary - Get department summary (HOD)
router.get('/department-summary', protect, authorize(ROLES.HOD), attendanceController.getDepartmentSummary);

// GET /api/attendance/institution-summary - Get institution summary (Admin)
router.get('/institution-summary', protect, authorize(ROLES.ADMIN), attendanceController.getInstitutionSummary);

module.exports = router;
