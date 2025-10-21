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

    const trendingProducts = products.map(product => {
      const productObj = product.toObject();
      productObj.images = transformProductImages(productObj);
      return {
        id: productObj._id,
        title: productObj.name,
        description: productObj.description,
        price: productObj.price,
        image: productObj.image,
        subImg: productObj.subImg,
        images: productObj.images,
        category: productObj.category
      };
    });

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

// Helper function to ensure images is an array of strings
const transformProductImages = (productObj) => {
  if (Array.isArray(productObj.images)) {
    return productObj.images;
  } else if (typeof productObj.images === 'string' && productObj.images.trim() !== '') {
    // Backward compatibility: split string into array
    return productObj.images.split(', ').map(url => url.trim());
  } else {
    return [];
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

    // Transform images from string to array of strings
    const productObj = product.toObject();
    productObj.images = transformProductImages(productObj);

    res.status(200).json({
      success: true,
      data: productObj
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
    const imageUrls = [];
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
      imageUrls.push(imageResult.secure_url);
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      size,
      category,
      images: imageUrls,
      image: imageUrls[0], // Set main image to first image
      subImg: imageUrls[1] || null, // Set subImg to second image if exists
      isTrending: true
    });

    // Transform images to ensure array of strings
    const productObj = product.toObject();
    productObj.images = transformProductImages(productObj);

    res.status(201).json({
      success: true,
      data: productObj
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
      const newImageUrls = [];
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
        newImageUrls.push(imageResult.secure_url);
      }

      // Delete old images from Cloudinary
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.images && oldProduct.images.length > 0) {
        for (const oldImageUrl of oldProduct.images) {
          const oldPublicId = getPublicIdFromUrl(oldImageUrl);
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId);
          }
        }
      }

      updateData.images = newImageUrls;
      updateData.image = newImageUrls[0]; // Set main image to first image
      updateData.subImg = newImageUrls[1] || null; // Set subImg to second image if exists
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

    // Transform images to ensure array of strings
    const productObj = product.toObject();
    productObj.images = transformProductImages(productObj);

    res.status(200).json({
      success: true,
      data: productObj
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
      for (const imageUrl of product.images) {
        const publicId = getPublicIdFromUrl(imageUrl);
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