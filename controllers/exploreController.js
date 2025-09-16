const Product = require('../models/Product');
const Category = require('../models/Category');
const path = require('path');
const fs = require('fs');

// @desc    Get explore collection with products grouped by categories
// @route   GET /api/explore
// @access  Public
exports.getExploreCollection = async (req, res, next) => {
  try {
    // Fetch dynamic categories
    const categoryDocs = await Category.find().sort({ createdAt: -1 }).select('title imageUrl');
    const categoryList = categoryDocs.map(cat => ({
      title: cat.title,
      image: `https://node-vw5f.onrender.com${cat.imageUrl}`,
      id: cat._id
    }));

    const categories = ['All', ...categoryDocs.map(cat => cat.title)];
    const collection = {};

    // Add categories to collection
    collection.Categories = categoryList;

    // Get all products for "All" category
    const allProducts = await Product.find({ isExplore: true }).sort({ createdAt: -1 }).select('name price image category');
    collection.All = allProducts.map(product => ({
      id: product._id,
      title: product.name,
      price: product.price,
      image: `https://node-vw5f.onrender.com${product.image}`,
      category: product.category
    }));

    // Get products for each specific category
    for (const category of categories.slice(1)) { // Skip 'All'
      const products = await Product.find({ category, isExplore: true }).sort({ createdAt: -1 }).select('name price image category');
      collection[category] = products.map(product => ({
        id: product._id,
        title: product.name,
        price: product.price,
        image: `https://node-vw5f.onrender.com${product.image}`,
        category: product.category
      }));
    }

    res.status(200).json({
      success: true,
      message: 'Discover premium fitness wear for every workout',
      data: collection
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get single explore product
// @route   GET /api/explore/:id
// @access  Public
exports.getExploreProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isExplore) {
      const error = new Error('Explore product not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Create new product for explore collection with image upload
// @route   POST /api/explore
// @access  Public
exports.createExploreProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, size } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      const error = new Error('Please upload an image');
      error.statusCode = 400;
      return next(error);
    }

    // Create image URL
    const image = `/uploads/${req.file.filename}`;

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      category,
      size,
      image,
      isExplore: true
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Update explore product
// @route   PUT /api/explore/:id
// @access  Public
exports.updateExploreProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, size } = req.body;

    let updateData = {
      name,
      description,
      price: parseFloat(price),
      category,
      size
    };

    // If new image uploaded, update image URL
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;

      // Delete old image file if exists
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.image) {
        const oldImagePath = path.join(__dirname, '..', 'public', oldProduct.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product || !product.isExplore) {
      const error = new Error('Explore product not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete explore product
// @route   DELETE /api/explore/:id
// @access  Public
exports.deleteExploreProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product || !product.isExplore) {
      const error = new Error('Explore product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Delete image file
    if (product.image) {
      const imagePath = path.join(__dirname, '..', 'public', product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Explore product deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};
