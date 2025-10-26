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

// Helper function to ensure images is an array of objects {id, url}
const transformProductImages = (productObj) => {
  if (Array.isArray(productObj.images)) {
    // If already objects, return as is
    if (productObj.images.length > 0 && typeof productObj.images[0] === 'object' && productObj.images[0].id && productObj.images[0].url) {
      return productObj.images;
    } else if (productObj.images.length > 0 && typeof productObj.images[0] === 'string') {
      // Backward compatibility: convert strings to objects
      return productObj.images.map(url => ({ id: crypto.randomUUID(), url }));
    } else {
      return productObj.images;
    }
  } else if (typeof productObj.images === 'string' && productObj.images.trim() !== '') {
    // Backward compatibility: split string into array of objects
    return productObj.images.split(', ').map(url => ({ id: crypto.randomUUID(), url: url.trim() }));
  } else {
    return [];
  }
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
          images: product.images,
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

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      category,
      size,
      images: [{ id: crypto.randomUUID(), url: imageResult.secure_url }],
      image: imageResult.secure_url,
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
        image: imageResult.secure_url,
        images: [imageResult.secure_url]
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

    // If new image uploaded, update image
    if (req.file) {
      // Upload new image to Cloudinary
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

      // Delete old image from Cloudinary
      if (product.image) {
        const oldPublicId = getPublicIdFromUrl(product.image);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      }

      updateData.images = [{ id: crypto.randomUUID(), url: imageResult.secure_url }];
      updateData.image = imageResult.secure_url;
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