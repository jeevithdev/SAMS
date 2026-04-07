const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authorize, authorizeOwnerOrRoles, ROLES } = require('../middleware/rbac');
const marksController = require('../controllers/marksController');

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

// GET /api/marks/my - Get current student's marks
router.get('/my', protect, authorize(ROLES.STUDENT), marksController.getMyMarks);

// GET /api/marks/my/consolidated - Get current student's consolidated marks
router.get('/my/consolidated', protect, authorize(ROLES.STUDENT), marksController.getMyConsolidatedMarks);

// GET /api/marks/report - Get marks report (Staff, HOD, Admin)
router.get('/report', protect, authorize(ROLES.STAFF, ROLES.HOD, ROLES.ADMIN), marksController.getMarksReport);

// POST /api/marks/enter - Enter marks in batch (Staff with allocation)
router.post('/enter',
  protect,
  authorize(ROLES.STAFF, ROLES.HOD),
  [
    body('subject').notEmpty().withMessage('Subject is required'),
    body('type').notEmpty().withMessage('Mark type is required'),
    body('records').isArray({ min: 1 }).withMessage('Records are required'),
    body('records.*.student').notEmpty().withMessage('Student ID is required'),
    body('records.*.marks').isNumeric().withMessage('Marks must be a number')
  ],
  handleValidation,
  marksController.enterMarksBatch
);

// POST /api/marks - Enter marks (Staff with allocation)
router.post('/',
  protect,
  authorize(ROLES.STAFF, ROLES.HOD),
  [
    body('subject').notEmpty().withMessage('Subject is required'),
    body('section').trim().notEmpty().withMessage('Section is required'),
    body('student').notEmpty().withMessage('Student is required'),
    body('markType').isIn(['cia', 'assignment', 'lab', 'attendance']).withMessage('Valid mark type is required'),
    body('marks').isNumeric().withMessage('Marks must be a number')
  ],
  handleValidation,
  marksController.enterMarks
);

// POST /api/marks/batch - Enter marks for multiple students (Staff with allocation)
router.post('/batch',
  protect,
  authorize(ROLES.STAFF, ROLES.HOD),
  [
    body('subject').notEmpty().withMessage('Subject is required'),
    body('section').trim().notEmpty().withMessage('Section is required'),
    body('markType').isIn(['cia', 'assignment', 'lab']).withMessage('Valid mark type is required'),
    body('records').isArray({ min: 1 }).withMessage('Records are required'),
    body('records.*.student').notEmpty().withMessage('Student ID is required'),
    body('records.*.marks').isNumeric().withMessage('Marks must be a number')
  ],
  handleValidation,
  marksController.enterMarks
);

// POST /api/marks/calculate-attendance/:subjectId/:section - Calculate attendance marks (Staff with allocation)
router.post('/calculate-attendance/:subjectId/:section',
  protect,
  authorize(ROLES.STAFF, ROLES.HOD),
  marksController.calculateAttendanceMarks
);

// GET /api/marks/subject/:subjectId/:section - Get subject marks (Staff with allocation, HOD, Admin)
router.get('/subject/:subjectId/:section',
  protect,
  authorize(ROLES.STAFF, ROLES.HOD, ROLES.ADMIN),
  marksController.getSubjectMarks
);

// GET /api/marks/student/:studentId - Get student's marks (Owner, Mentor, HOD, Admin)
router.get('/student/:studentId',
  protect,
  authorizeOwnerOrRoles(ROLES.ADMIN, ROLES.HOD, ROLES.STAFF),
  marksController.getStudentMarks
);

// GET /api/marks/department-summary - Get department summary (HOD)
router.get('/department-summary', protect, authorize(ROLES.HOD), marksController.getDepartmentSummary);

// GET /api/marks/institution-summary - Get institution summary (Admin)
router.get('/institution-summary', protect, authorize(ROLES.ADMIN), marksController.getInstitutionSummary);

module.exports = router;
