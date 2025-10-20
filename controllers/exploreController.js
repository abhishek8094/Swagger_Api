const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
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
          { folder: 'explore' },
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
      category,
      size,
      images: imageUrls,
      image: imageUrls[0], // Set main image to first image
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
        image: imageUrls[0]
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

    // If new images uploaded, update images
    if (req.files && req.files.images && req.files.images.length > 0) {
      // Upload new images to Cloudinary
      const newImageUrls = [];
      for (const file of req.files.images) {
        const imageResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'explore' },
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
      if (product.images && product.images.length > 0) {
        for (const oldImageUrl of product.images) {
          const oldPublicId = getPublicIdFromUrl(oldImageUrl);
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId);
          }
        }
      }

      updateData.images = newImageUrls;
      updateData.image = newImageUrls[0]; // Set main image to first image
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
        image: updatedProduct.image
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
      message: 'Explore product deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }}