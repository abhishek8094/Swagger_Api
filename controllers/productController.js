
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// @desc    Get all products for carousel
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    // Prefix imageUrl with localhost URL
    const productsWithFullImageUrl = products.map(product => {
      const productObj = product.toObject();
      productObj.imageUrl = `http://localhost:3001${productObj.imageUrl}`;
      return productObj;
    });

    res.status(200).json({
      success: true,
      count: productsWithFullImageUrl.length,
      data: productsWithFullImageUrl
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Prefix imageUrl with localhost URL
    const productObj = product.toObject();
    productObj.imageUrl = `http://localhost:3001${productObj.imageUrl}`;

    res.status(200).json({
      success: true,
      data: productObj
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Create new product with image upload
// @route   POST /api/products
// @access  Public
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, isExplore, size } = req.body;

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
      size,
      category,
      imageUrl,
      isExplore: isExplore || false
    });

    // Prefix imageUrl with localhost URL for response
    const productObj = product.toObject();
    productObj.imageUrl = `http://localhost:3001${productObj.imageUrl}`;

    res.status(201).json({
      success: true,
      data: productObj
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};



// @desc    Update product
// @route   PUT /api/products/:id
// @access  Public
exports.updateProduct = async (req, res, next) => {
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

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Prefix imageUrl with localhost URL for response
    const productObj = product.toObject();
    productObj.imageUrl = `http://localhost:3001${productObj.imageUrl}`;

    res.status(200).json({
      success: true,
      data: productObj
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Public
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      const error = new Error('Product not found');
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
      message: 'Product deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, category } = req.query;

    let query = {};

    // Search by name or description
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    // Prefix imageUrl with localhost URL
    const productsWithFullImageUrl = products.map(product => {
      const productObj = product.toObject();
      productObj.imageUrl = `http://localhost:3001${productObj.imageUrl}`;
      return productObj;
    });

    res.status(200).json({
      success: true,
      count: productsWithFullImageUrl.length,
      data: productsWithFullImageUrl
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};



