const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const allocationController = require('../controllers/allocationController');

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

// POST /api/allocations - Create subject allocation (Admin)
router.post('/',
  protect,
  authorize(ROLES.ADMIN),
  [
    body('faculty').notEmpty().withMessage('Faculty ID is required'),
    body('subject').notEmpty().withMessage('Subject ID is required'),
    body('section').trim().notEmpty().withMessage('Section is required')
  ],
  handleValidation,
  allocationController.createAllocation
);

// GET /api/allocations - List allocations (Admin, HOD)
router.get('/', protect, authorize(ROLES.ADMIN, ROLES.HOD), allocationController.listAllocations);

// GET /api/allocations/my-allocations - Get staff's allocations (Staff, HOD)
router.get('/my-allocations', protect, authorize(ROLES.STAFF, ROLES.HOD), allocationController.getMyAllocations);

// GET /api/allocations/my - Alias for my-allocations (Staff, HOD)
router.get('/my', protect, authorize(ROLES.STAFF, ROLES.HOD), allocationController.getMyAllocations);

// DELETE /api/allocations/:id - Remove allocation (Admin)
router.delete('/:id', protect, authorize(ROLES.ADMIN), allocationController.deleteAllocation);

module.exports = router;
