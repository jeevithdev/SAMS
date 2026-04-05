const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const subjectController = require('../controllers/subjectController');

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

// POST /api/subjects - Create subject (Admin)
router.post('/',
  protect,
  authorize(ROLES.ADMIN),
  [
    body('name').trim().notEmpty().withMessage('Subject name is required'),
    body('code').trim().notEmpty().withMessage('Subject code is required'),
    body('program').notEmpty().withMessage('Program is required'),
    body('semester').isInt({ min: 1, max: 8 }).withMessage('Valid semester (1-8) is required')
  ],
  handleValidation,
  subjectController.createSubject
);

// GET /api/subjects - List subjects (Authenticated)
router.get('/', protect, subjectController.listSubjects);

// GET /api/subjects/my-subjects - Get allocated subjects for staff (Staff, HOD)
router.get('/my-subjects', protect, authorize(ROLES.STAFF, ROLES.HOD), subjectController.getMySubjects);

// GET /api/subjects/:id - Get subject by ID (Authenticated)
router.get('/:id', protect, subjectController.getSubjectById);

// PUT /api/subjects/:id - Update subject (Admin)
router.put('/:id', protect, authorize(ROLES.ADMIN), subjectController.updateSubject);

module.exports = router;
