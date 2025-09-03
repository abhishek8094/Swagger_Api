
const Category = require('../models/Category');
const Product = require('../models/Product');

// @desc    Get all categories with image and title
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories.map(cat => ({
        title: cat.title,
        image: `http://localhost:3001${cat.imageUrl}`,
        id: cat._id
      }))
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Create new category
// @route   POST /api/categories
// @access  Public
exports.createCategory = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!req.file) {
      const error = new Error('Please upload an image');
      error.statusCode = 400;
      return next(error);
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    const category = await Category.create({
      title,
      imageUrl
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Public
exports.updateCategory = async (req, res, next) => {
  try {
    const { title } = req.body;

    let updateData = { title };

    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;

      // Delete old image file if exists
      const oldCategory = await Category.findById(req.params.id);
      if (oldCategory && oldCategory.imageUrl) {
        const path = require('path');
        const fs = require('fs');
        const oldImagePath = path.join(__dirname, '..', 'public', oldCategory.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Public
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      return next(error);
    }

    // Delete image file
    if (category.imageUrl) {
      const path = require('path');
      const fs = require('fs');
      const imagePath = path.join(__dirname, '..', 'public', category.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};
