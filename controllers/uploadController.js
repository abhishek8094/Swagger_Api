
const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const cloudinary = require('../config/cloudinary');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

// @desc    Upload multiple images for a product or accessory
// @route   POST /api/upload-images/:productId
// @access  Public
exports.uploadMultipleImages = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Validate required fields
    if (!productId) {
      const error = new Error('Product ID is required');
      error.statusCode = 400;
      return next(error);
    }

    // Validate productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const error = new Error('Invalid Product ID format');
      error.statusCode = 400;
      return next(error);
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      const error = new Error('Please upload at least one image');
      error.statusCode = 400;
      return next(error);
    }

    // Find the product or accessory
    let item = await Product.findById(productId);
    let isProduct = true;

    if (!item) {
      item = await Accessory.findById(productId);
      isProduct = false;
    }

    if (!item) {
      const error = new Error('Product or Accessory not found');
      error.statusCode = 404;
      return next(error);
    }

    // Upload images to Cloudinary
    const uploadedImages = [];
    for (const file of req.files) {
      const imageResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: isProduct ? 'products' : 'accessories' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      });
      const imageId = crypto.randomUUID();
      uploadedImages.push({ id: imageId, url: imageResult.secure_url });
    }

    // Update the item's images array
    const updatedItem = await (isProduct ? Product : Accessory).findByIdAndUpdate(
      productId,
      { $push: { images: { $each: uploadedImages } } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      data: {
        id: updatedItem._id,
        images: updatedItem.images
      }
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete specific images from a product or accessory
// @route   DELETE /api/upload-images/:productId
// @access  Public
exports.deleteMultipleImages = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { imageIds } = req.body; // Array of image IDs to delete

    if (!productId) {
      const error = new Error('Product ID is required');
      error.statusCode = 400;
      return next(error);
    }

    // Validate productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const error = new Error('Invalid Product ID format');
      error.statusCode = 400;
      return next(error);
    }

    if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
      const error = new Error('Please provide an array of image IDs to delete');
      error.statusCode = 400;
      return next(error);
    }

    // Find the product or accessory
    let item = await Product.findById(productId);
    let isProduct = true;

    if (!item) {
      item = await Accessory.findById(productId);
      isProduct = false;
    }

    if (!item) {
      const error = new Error('Product or Accessory not found');
      error.statusCode = 404;
      return next(error);
    }

    // Find images to delete by ID
    const imagesToDelete = item.images.filter(img => imageIds.includes(img.id));
    if (imagesToDelete.length === 0) {
      const error = new Error('No matching images found to delete');
      error.statusCode = 404;
      return next(error);
    }
    // Delete images from Cloudinary
    const deletePromises = imagesToDelete.map(async (img) => {
      if (img && img.url) {
        const publicId = getPublicIdFromUrl(img.url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    });
    await Promise.all(deletePromises);

    // Remove images from the item's images array
    const updatedItem = await (isProduct ? Product : Accessory).findByIdAndUpdate(
      productId,
      { $pull: { images: { id: { $in: imageIds } } } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `${imagesToDelete.length} image(s) deleted successfully`,
      data: {
        id: updatedItem._id,
        images: updatedItem.images
      }
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete images by index from a product or accessory
// @route   POST /api/upload-images/:productId/delete-by-index
// @access  Public
exports.deleteImagesByIndex = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { indices } = req.body; // Array of indices to delete

    if (!productId) {
      const error = new Error('Product ID is required');
      error.statusCode = 400;
      return next(error);
    }

    // Validate productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      const error = new Error('Invalid Product ID format');
      error.statusCode = 400;
      return next(error);
    }

    if (!indices || !Array.isArray(indices) || indices.length === 0) {
      const error = new Error('Please provide an array of indices to delete');
      error.statusCode = 400;
      return next(error);
    }

    // Validate indices are numbers and unique
    const uniqueIndices = [...new Set(indices)];
    if (uniqueIndices.length !== indices.length) {
      const error = new Error('Indices must be unique');
      error.statusCode = 400;
      return next(error);
    }

    for (const index of uniqueIndices) {
      if (typeof index !== 'number' || index < 0 || !Number.isInteger(index)) {
        const error = new Error('All indices must be non-negative integers');
        error.statusCode = 400;
        return next(error);
      }
    }

    // Find the product or accessory
    let item = await Product.findById(productId);
    let isProduct = true;

    if (!item) {
      item = await Accessory.findById(productId);
      isProduct = false;
    }

    if (!item) {
      const error = new Error('Product or Accessory not found');
      error.statusCode = 404;
      return next(error);
    }

    // Validate indices are within bounds
    const maxIndex = item.images.length - 1;
    for (const index of uniqueIndices) {
      if (index > maxIndex) {
        const error = new Error(`Index ${index} is out of bounds. Maximum index is ${maxIndex}`);
        error.statusCode = 400;
        return next(error);
      }
    }

    // Sort indices in descending order to avoid index shifting issues
    const sortedIndices = uniqueIndices.sort((a, b) => b - a);

    // Collect images to delete
    const imagesToDelete = sortedIndices.map(index => item.images[index]);

    // Delete images from Cloudinary
    const deletePromises = imagesToDelete.map(async (img) => {
      if (img && img.url) {
        const publicId = getPublicIdFromUrl(img.url);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    });
    await Promise.all(deletePromises);

    // Remove images from the item's images array by index
    const updatedImages = item.images.filter((_, index) => !uniqueIndices.includes(index));
    const updatedItem = await (isProduct ? Product : Accessory).findByIdAndUpdate(
      productId,
      { images: updatedImages },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `${imagesToDelete.length} image(s) deleted successfully`,
      data: {
        id: updatedItem._id,
        images: updatedItem.images
      }
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};
