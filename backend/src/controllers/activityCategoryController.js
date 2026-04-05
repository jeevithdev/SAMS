const ActivityCategory = require('../models/ActivityCategory');

/**
 * Create activity category
 * @route POST /api/activity-categories
 * @access Admin
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    const category = await ActivityCategory.create({
      name,
      description
    });
    
    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List activity categories
 * @route GET /api/activity-categories
 * @access All authenticated
 */
exports.listCategories = async (req, res, next) => {
  try {
    const categories = await ActivityCategory.find({ isActive: true })
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update activity category
 * @route PUT /api/activity-categories/:id
 * @access Admin
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    
    const category = await ActivityCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    if (name) category.name = name;
    if (description !== undefined) category.description = description;
    if (typeof isActive === 'boolean') category.isActive = isActive;
    
    await category.save();
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};
