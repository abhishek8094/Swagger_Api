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

// Helper function to ensure images is an array of objects {id, url}, excluding the main image
const transformProductImages = (productObj) => {
  let images = [];
  if (Array.isArray(productObj.images)) {
    // If already objects, return as is
    if (productObj.images.length > 0 && typeof productObj.images[0] === 'object' && productObj.images[0].id && productObj.images[0].url) {
      images = productObj.images;
    } else if (productObj.images.length > 0 && typeof productObj.images[0] === 'string') {
      // Backward compatibility: convert strings to objects
      images = productObj.images.map(url => ({ id: crypto.randomUUID(), url }));
    } else {
      images = productObj.images;
    }
  } else if (typeof productObj.images === 'string' && productObj.images.trim() !== '') {
    // Backward compatibility: split string into array of objects
    images = productObj.images.split(', ').map(url => ({ id: crypto.randomUUID(), url: url.trim() }));
  }

  // Filter out the main image URL from images array
  if (productObj.image) {
    images = images.filter(img => img.url !== productObj.image);
  }

  return images;
};

// @desc    Get explore collection
// @route   GET /api/explore
// @access  Public
exports.getExploreCollection = async (req, res, next) => {
  try {
    // Build query
    let query = { isExplore: true };

    // Get unique categories from explore products
    const categories = await Product.distinct('category', query);

    // Get explore products
    const products = await Product.find(query).sort({ createdAt: -1 }).select('name price image images category _id');

    // Initialize groupedProducts with unique categories
    const groupedProducts = categories.reduce((acc, category) => {
      acc[category] = [];
      return acc;
    }, {});

    // Group products by category
    products.forEach(product => {
      const category = product.category;
      if (groupedProducts[category]) {
        groupedProducts[category].push({
          id: product._id,
          title: product.name,
          price: product.price,
          image: product.image,
          images: transformProductImages(product),
          category: product.category
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Discover premium fitness wear for every workout',
      data: groupedProducts
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
      data: {
        ...product.toObject(),
        images: transformProductImages(product)
      }
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

    // Validate required fields
    if (!name || !price || !category || !size) {
      const error = new Error('Please provide name, price, category, and size');
      error.statusCode = 400;
      return next(error);
    }

    // Validate that an image is uploaded
    if (!req.file) {
      const error = new Error('Please add an image');
      error.statusCode = 400;
      return next(error);
    }

    // Upload image to Cloudinary
    const imageResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'explore' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });
    const mainImage = imageResult.secure_url;

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      category,
      size,
      images: [],
      image: mainImage,
      isExplore: true
    });

    res.status(201).json({
      success: true,
      message: 'Explore product created successfully',
      data: {
        id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        size: product.size,
        image: mainImage,
        images: transformProductImages(product)
      }
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
    const product = await Product.findById(req.params.id);

    if (!product || !product.isExplore) {
      const error = new Error('Explore product not found');
      error.statusCode = 404;
      return next(error);
    }

    const { name, description, price, category, size } = req.body;

    let updateData = {
      name,
      description,
      price: parseFloat(price),
      category,
      size
    };

    // If new image uploaded, append to existing images
    if (req.file) {
      // Upload new image to Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'explore' },
        (error, result) => {
          if (error) {
            const uploadError = new Error('Image upload failed');
            uploadError.statusCode = 500;
            return next(uploadError);
          }
        }
      );
      uploadStream.end(req.file.buffer);

      // Wait for upload to complete
      const imageResult = await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => resolve(uploadStream.result));
        uploadStream.on('error', reject);
      });

      // Prepare new image object
      const newImage = {
        id: crypto.randomUUID(),
        url: imageResult.secure_url
      };

      // Append new image to existing ones
      updateData.images = [...transformProductImages(product), newImage];

      // Update main image if it's the first update or if no main image
      if (!product.image || product.images.length === 0) {
        updateData.image = imageResult.secure_url;
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Explore product updated successfully',
      data: {
        id: updatedProduct._id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        price: updatedProduct.price,
        category: updatedProduct.category,
        size: updatedProduct.size,
        image: updatedProduct.image,
        images: transformProductImages(updatedProduct)
      }
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
      message: 'Explore product deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }}