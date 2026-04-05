const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authorize, authorizeOwnerOrRoles, ROLES } = require('../middleware/rbac');
const userController = require('../controllers/userController');

const router = express.Router();

// Validation middleware
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

// GET /api/users - List users with filters (Admin, HOD)
router.get('/', protect, authorize(ROLES.ADMIN, ROLES.HOD), userController.listUsers);

// GET /api/users/mentees - Get mentees for current staff (Staff, HOD)
router.get('/mentees', protect, authorize(ROLES.STAFF, ROLES.HOD), userController.getMentees);

// GET /api/users/students-by-allocation - Get students for allocated subjects (Staff)
router.get('/students-by-allocation', protect, authorize(ROLES.STAFF), userController.getStudentsByAllocation);

// GET /api/users/:id - Get user by ID (Admin, HOD, Self)
router.get('/:id', protect, authorizeOwnerOrRoles(ROLES.ADMIN, ROLES.HOD), userController.getUserById);

// PUT /api/users/:id - Update user (Admin)
router.put('/:id', protect, authorize(ROLES.ADMIN), userController.updateUser);

// DELETE /api/users/:id - Deactivate user (Admin)
router.delete('/:id', protect, authorize(ROLES.ADMIN), userController.deactivateUser);

// PUT /api/users/:id/mentor - Assign mentor to student (Admin)
router.put('/:id/mentor',
  protect,
  authorize(ROLES.ADMIN),
  [
    body('mentorId').notEmpty().withMessage('Mentor ID is required')
  ],
  handleValidation,
  userController.assignMentor
);

module.exports = router;
