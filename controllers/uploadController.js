const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const cloudinary = require('../config/cloudinary');

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
      uploadedImages.push(imageResult.secure_url);
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
    const { imageUrls } = req.body; // Array of image URLs to delete

    if (!productId) {
      const error = new Error('Product ID is required');
      error.statusCode = 400;
      return next(error);
    }

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      const error = new Error('Please provide an array of image URLs to delete');
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

    // Delete images from Cloudinary
    const deletePromises = imageUrls.map(async (url) => {
      const publicId = getPublicIdFromUrl(url);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    });
    await Promise.all(deletePromises);

    // Remove images from the item's images array
    const updatedItem = await (isProduct ? Product : Accessory).findByIdAndUpdate(
      productId,
      { $pull: { images: { $in: imageUrls } } },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: `${imageUrls.length} image(s) deleted successfully`,
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
