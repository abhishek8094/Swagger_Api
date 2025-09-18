const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

// @desc    Get all products for carousel
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    // Images are already full Cloudinary URLs
    const productsWithFullImage = products.map(product => product.toObject());

    res.status(200).json({
      success: true,
      count: productsWithFullImage.length,
      data: productsWithFullImage
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

    // Images are already full Cloudinary URLs
    const productObj = product.toObject();

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

    // Validate required fields
    if (!size || !['S', 'M', 'L', 'XL'].includes(size)) {
      const error = new Error('Please add a valid product size (S, M, L, XL)');
      error.statusCode = 400;
      return next(error);
    }

    // Check if file was uploaded
    if (!req.file) {
      const error = new Error('Please upload an image');
      error.statusCode = 400;
      return next(error);
    }

    // Upload image to Cloudinary
    const imageResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'products' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const imageUrl = imageResult.secure_url;

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      size,
      category,
      image: imageUrl,
      isExplore: isExplore || false
    });

    // Images are already full Cloudinary URLs
    const productObj = product.toObject();

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
// @route   POST /api/products/update/:id
// @access  Public
exports.updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, size } = req.body;

    // Validate size if provided
    if (size && !['S', 'M', 'L', 'XL'].includes(size)) {
      const error = new Error('Please add a valid product size (S, M, L, XL)');
      error.statusCode = 400;
      return next(error);
    }

    let updateData = {
      name,
      description,
      price: parseFloat(price),
      category,
      size
    };

    // If new image uploaded, update image
    if (req.file) {
      // Upload new image to Cloudinary
      const imageResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'products' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const newImageUrl = imageResult.secure_url;

      // Delete old image from Cloudinary
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.image) {
        const oldPublicId = getPublicIdFromUrl(oldProduct.image);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      }

      updateData.image = newImageUrl;
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

    // Images are already full Cloudinary URLs
    const productObj = product.toObject();

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
// @route   POST /api/products/delete/:id
// @access  Public
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Delete image from Cloudinary
    if (product.image) {
      const publicId = getPublicIdFromUrl(product.image);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
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

    // Images are already full Cloudinary URLs
    const productsWithFullImage = products.map(product => product.toObject());

    res.status(200).json({
      success: true,
      count: productsWithFullImage.length,
      data: productsWithFullImage
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};
