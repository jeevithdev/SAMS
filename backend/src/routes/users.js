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

// POST /api/users - Create a new user (Admin: HOD only, HOD: staff/students in dept)
router.post('/',
  protect,
  authorize(ROLES.ADMIN, ROLES.HOD),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').isIn(Object.values(ROLES)).withMessage('Valid role is required')
  ],
  handleValidation,
  userController.createUser
);

// GET /api/users/mentees - Get mentees for current staff (Staff, HOD)
router.get('/mentees', protect, authorize(ROLES.STAFF, ROLES.HOD), userController.getMentees);

// GET /api/users/students-by-allocation - Get students for allocated subjects (Staff)
router.get('/students-by-allocation', protect, authorize(ROLES.STAFF), userController.getStudentsByAllocation);

// GET /api/users/students/by-class - Get students by class (Staff, HOD, Admin)
router.get('/students/by-class', protect, authorize(ROLES.STAFF, ROLES.HOD, ROLES.ADMIN), userController.getStudentsByClass);

// GET /api/users/:id - Get user by ID (Admin, HOD, Self)
router.get('/:id', protect, authorizeOwnerOrRoles(ROLES.ADMIN, ROLES.HOD), userController.getUserById);

// PUT /api/users/:id - Update user (Admin: HOD only, HOD: staff/students in dept)
router.put('/:id', protect, authorize(ROLES.ADMIN, ROLES.HOD), userController.updateUser);

// DELETE /api/users/:id - Deactivate user (Admin: HOD only, HOD: staff/students in dept)
router.delete('/:id', protect, authorize(ROLES.ADMIN, ROLES.HOD), userController.deactivateUser);

// PUT /api/users/:id/mentor - Assign mentor to student (HOD: own dept only)
router.put('/:id/mentor',
  protect,
  authorize(ROLES.HOD),
  [
    body('mentorId').notEmpty().withMessage('Mentor ID is required')
  ],
  handleValidation,
  userController.assignMentor
);

module.exports = router;
