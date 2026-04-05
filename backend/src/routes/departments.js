const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const departmentController = require('../controllers/departmentController');

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

// POST /api/departments - Create department (Admin)
router.post('/',
  protect,
  authorize(ROLES.ADMIN),
  [
    body('name').trim().notEmpty().withMessage('Department name is required'),
    body('code').trim().notEmpty().withMessage('Department code is required')
  ],
  handleValidation,
  departmentController.createDepartment
);

// GET /api/departments - List departments (Authenticated)
router.get('/', protect, departmentController.listDepartments);

// GET /api/departments/:id - Get department by ID (Authenticated)
router.get('/:id', protect, departmentController.getDepartmentById);

// PUT /api/departments/:id - Update department (Admin)
router.put('/:id', protect, authorize(ROLES.ADMIN), departmentController.updateDepartment);

// PUT /api/departments/:id/hod - Assign HOD to department (Admin)
router.put('/:id/hod',
  protect,
  authorize(ROLES.ADMIN),
  [
    body('hodId').notEmpty().withMessage('HOD user ID is required')
  ],
  handleValidation,
  departmentController.assignHod
);

module.exports = router;
