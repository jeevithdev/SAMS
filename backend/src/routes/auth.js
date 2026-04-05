const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const authController = require('../controllers/authController');

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

// POST /api/auth/register - Register a new user (Admin only)
router.post('/register',
  protect,
  authorize(ROLES.ADMIN),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('role').isIn(Object.values(ROLES)).withMessage('Valid role is required')
  ],
  handleValidation,
  authController.register
);

// POST /api/auth/login - Login user (Public)
router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidation,
  authController.login
);

// GET /api/auth/me - Get current user profile (Authenticated)
router.get('/me', protect, authController.getMe);

// PUT /api/auth/password - Change password (Authenticated)
router.put('/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  handleValidation,
  authController.changePassword
);

// POST /api/auth/setup-admin - Create initial admin (Public, one-time)
router.post('/setup-admin',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required')
  ],
  handleValidation,
  authController.setupAdmin
);

module.exports = router;
