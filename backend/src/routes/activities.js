const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const { authorize, authorizeOwnerOrRoles, ROLES } = require('../middleware/rbac');
const { ALLOWED_FILE_TYPES, ACTIVITY_STATUS } = require('../config/constants');
const activityController = require('../controllers/activityController');

const router = express.Router();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    const activityDir = path.join(uploadDir, 'activities');
    
    if (!fs.existsSync(activityDir)) {
      fs.mkdirSync(activityDir, { recursive: true });
    }
    
    cb(null, activityDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `activity-${req.user._id}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  }
});

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

// POST /api/activities - Submit new activity (Student)
router.post('/',
  protect,
  authorize(ROLES.STUDENT),
  upload.array('certificates', 5), // Support up to 5 certificate files
  [
    body('category').notEmpty().withMessage('Category is required'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('date').isISO8601().withMessage('Valid activity date is required')
  ],
  handleValidation,
  activityController.submitActivity
);

// GET /api/activities/my-activities - Get student's activities (Student)
router.get('/my-activities', protect, authorize(ROLES.STUDENT), activityController.getMyActivities);

// GET /api/activities/my-portfolio - Get current student's portfolio (Student)
router.get('/my-portfolio', protect, authorize(ROLES.STUDENT), activityController.getMyPortfolio);

// GET /api/activities/pending-verification - Get pending activities for mentor (Staff, HOD)
router.get('/pending-verification', protect, authorize(ROLES.STAFF, ROLES.HOD), activityController.getPendingVerification);

// GET /api/activities/department - Get department activities (HOD)
router.get('/department', protect, authorize(ROLES.HOD), activityController.getDepartmentActivities);

// GET /api/activities/all - Get all activities (Admin)
router.get('/all', protect, authorize(ROLES.ADMIN), activityController.getAllActivities);

// GET /api/activities/portfolio/:studentId - Get student portfolio (Owner, Mentor, HOD, Admin)
router.get('/portfolio/:studentId', 
  protect, 
  authorizeOwnerOrRoles(ROLES.ADMIN, ROLES.HOD, ROLES.STAFF), 
  activityController.getPortfolio
);

// PUT /api/activities/:id/verify - Verify or reject activity (Staff mentor)
router.put('/:id/verify',
  protect,
  authorize(ROLES.STAFF, ROLES.HOD),
  [
    body('status').isIn([ACTIVITY_STATUS.VERIFIED, ACTIVITY_STATUS.REJECTED]).withMessage('Status must be verified or rejected'),
    body('rejectionReason').if(body('status').equals(ACTIVITY_STATUS.REJECTED)).notEmpty().withMessage('Rejection reason is required when rejecting')
  ],
  handleValidation,
  activityController.verifyActivity
);

// PUT /api/activities/:id - Resubmit rejected activity (Student owner)
router.put('/:id',
  protect,
  authorize(ROLES.STUDENT),
  upload.single('certificate'),
  activityController.resubmitActivity
);

// GET /api/activities/:id - Get activity by ID (Owner, Mentor, HOD, Admin)
router.get('/:id', protect, activityController.getActivityById);

module.exports = router;
