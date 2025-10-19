
const Category = require('../models/Category');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

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
        image: cat.imageUrl,
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

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'categories' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const imageUrl = result.secure_url;

    const category = await Category.create({
      title,
      imageUrl
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: category._id,
        title: category.title,
        imageUrl: imageUrl
      }
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
    const category = await Category.findById(req.params.id);

    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = 404;
      return next(error);
    }

    const { title } = req.body;
    let updateData = { title };

    if (req.file) {
      // Upload new to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'categories' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const newImageUrl = result.secure_url;

      // Delete old from Cloudinary
      if (category.imageUrl) {
        const oldPublicId = getPublicIdFromUrl(category.imageUrl);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      }

      updateData.imageUrl = newImageUrl;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        id: updatedCategory._id,
        title: updatedCategory.title,
        imageUrl: updatedCategory.imageUrl
      }
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

    // Delete image from Cloudinary
    if (category.imageUrl) {
      const publicId = getPublicIdFromUrl(category.imageUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
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
