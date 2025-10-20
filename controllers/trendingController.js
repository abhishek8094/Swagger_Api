const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');
const crypto = require('crypto');

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

// @desc    Get trending products (top 10 recent products)
// @route   GET /api/trending
// @access  Public
exports.getTrendingProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isTrending: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('_id name description price image subImg images category');

    const trendingProducts = products.map(product => ({
      id: product._id,
      title: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      subImg: product.subImg,
      images: product.images,
      category: product.category
    }));

    res.status(200).json({
      success: true,
      message: 'Trending products retrieved successfully',
      data: trendingProducts
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get single trending product
// @route   GET /api/trending/:id
// @access  Public
exports.getTrendingProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isTrending: true });

    if (!product) {
      const error = new Error('Trending product not found');
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

// @desc    Create new trending product with image upload
// @route   POST /api/trending
// @access  Public
exports.createTrendingProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, size } = req.body;

    // Validate required fields
    if (!size) {
      const error = new Error('Please add a product size');
      error.statusCode = 400;
      return next(error);
    }

    // Check if files were uploaded
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      const error = new Error('Please upload at least one image');
      error.statusCode = 400;
      return next(error);
    }

    // Upload images to Cloudinary
    const imageObjects = [];
    for (const file of req.files.images) {
      const imageResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'trending' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
      const imageId = crypto.randomUUID();
      imageObjects.push({ id: imageId, url: imageResult.secure_url });
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      size,
      category,
      images: imageObjects,
      image: imageObjects[0].url, // Set main image to first image
      subImg: imageObjects[1] ? imageObjects[1].url : null, // Set subImg to second image if exists
      isTrending: true
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

// @desc    Update trending product
// @route   POST /api/trending/update/:id
// @access  Public
exports.updateTrendingProduct = async (req, res, next) => {
  try {
    // Check if product is trending
    const existingProduct = await Product.findOne({ _id: req.params.id, isTrending: true });
    if (!existingProduct) {
      const error = new Error('Trending product not found');
      error.statusCode = 404;
      return next(error);
    }

    const { name, description, price, category, size } = req.body;

    // Validate size if provided
    if (size && typeof size !== 'string') {
      const error = new Error('Size must be a string');
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

    // If new images uploaded, update images
    if (req.files && req.files.images && req.files.images.length > 0) {
      // Upload new images to Cloudinary
      const newImageObjects = [];
      for (const file of req.files.images) {
        const imageResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'trending' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
        const imageId = crypto.randomUUID();
        newImageObjects.push({ id: imageId, url: imageResult.secure_url });
      }

      // Delete old images from Cloudinary
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.images && oldProduct.images.length > 0) {
        for (const oldImageObj of oldProduct.images) {
          const oldPublicId = getPublicIdFromUrl(oldImageObj.url);
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId);
          }
        }
      }

      updateData.images = newImageObjects;
      updateData.image = newImageObjects[0].url; // Set main image to first image
      updateData.subImg = newImageObjects[1] ? newImageObjects[1].url : null; // Set subImg to second image if exists
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
      const error = new Error('Trending product not found');
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

// @desc    Delete trending product
// @route   DELETE /api/trending/:id
// @access  Public
exports.deleteTrendingProduct = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isTrending: true });

    if (!product) {
      const error = new Error('Trending product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const imageObj of product.images) {
        const publicId = getPublicIdFromUrl(imageObj.url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Trending product deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};