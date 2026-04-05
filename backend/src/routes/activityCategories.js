const express = require('express');
const { body, validationResult } = require('express-validator');
const { protect } = require('../middleware/auth');
const { authorize, ROLES } = require('../middleware/rbac');
const activityCategoryController = require('../controllers/activityCategoryController');

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

// POST /api/activity-categories - Create category (Admin)
router.post('/',
  protect,
  authorize(ROLES.ADMIN),
  [
    body('name').trim().notEmpty().withMessage('Category name is required')
  ],
  handleValidation,
  activityCategoryController.createCategory
);

// GET /api/activity-categories - List categories (Authenticated)
router.get('/', protect, activityCategoryController.listCategories);

// PUT /api/activity-categories/:id - Update category (Admin)
router.put('/:id', protect, authorize(ROLES.ADMIN), activityCategoryController.updateCategory);

module.exports = router;
