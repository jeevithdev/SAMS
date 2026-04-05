const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const programController = require('../controllers/programController');

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

// POST /api/programs - Create program (Admin)
router.post('/',
  protect,
  authorize(ROLES.ADMIN),
  [
    body('name').trim().notEmpty().withMessage('Program name is required'),
    body('code').trim().notEmpty().withMessage('Program code is required'),
    body('department').notEmpty().withMessage('Department is required')
  ],
  handleValidation,
  programController.createProgram
);

// GET /api/programs - List programs (Authenticated)
router.get('/', protect, programController.listPrograms);

// GET /api/programs/:id - Get program by ID (Authenticated)
router.get('/:id', protect, programController.getProgramById);

// PUT /api/programs/:id - Update program (Admin)
router.put('/:id', protect, authorize(ROLES.ADMIN), programController.updateProgram);

module.exports = router;
