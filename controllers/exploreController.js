const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// @desc    Get explore collection with products grouped by categories
// @route   GET /api/explore
// @access  Public
exports.getExploreCollection = async (req, res, next) => {
  try {
    const categories = ['All', 'Compression Fit', 'T-Shirts', 'Joggers', 'Shorts', 'Stringers'];
    const collection = {};

    // Get all products for "All" category
    const allProducts = await Product.find({ isExplore: true }).sort({ createdAt: -1 }).select('name price imageUrl category');
    collection.All = allProducts.map(product => ({
      id: product._id,
      title: product.name,
      price: product.price,
      image: `http://localhost:3001${product.imageUrl}`,
      category: product.category
    }));

    // Get products for each specific category
    for (const category of categories.slice(1)) { // Skip 'All'
      const products = await Product.find({ category, isExplore: true }).sort({ createdAt: -1 }).select('name price imageUrl category');
      collection[category] = products.map(product => ({
        id: product._id,
        title: product.name,
        price: product.price,
        image: `http://localhost:3001${product.imageUrl}`,
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
    const { name, description, price, category } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      const error = new Error('Please upload an image');
      error.statusCode = 400;
      return next(error);
    }

    // Create image URL
    const imageUrl = `/uploads/${req.file.filename}`;

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      category,
      imageUrl,
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
    const { name, description, price, category } = req.body;

    let updateData = {
      name,
      description,
      price: parseFloat(price),
      category
    };

    // If new image uploaded, update image URL
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;

      // Delete old image file if exists
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', 'public', oldProduct.imageUrl);
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
    if (product.imageUrl) {
      const imagePath = path.join(__dirname, '..', 'public', product.imageUrl);
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