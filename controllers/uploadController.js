const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const cloudinary = require('../config/cloudinary');

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

// @desc    Upload images for an item by ID
// @route   POST /api/upload/:id
// @access  Public
exports.uploadImages = async (req, res, next) => {
  try {
    const { id } = req.params;

    console.log('req.files:', req.files); // Debug logging

    // First, try to find in Product model
    let item = await Product.findById(id);

    // If not found in Product, try Accessory model
    if (!item) {
      item = await Accessory.findById(id);
    }

    if (!item) {
      const error = new Error('Item not found');
      error.statusCode = 404;
      return next(error);
    }

    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      const error = new Error('Please upload at least one image');
      error.statusCode = 400;
      return next(error);
    }

    // Determine folder based on model
    const folder = item.constructor.modelName === 'Product' ? 'products' : 'accessories';

    // Upload new images to Cloudinary
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: folder },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const newImageUrls = await Promise.all(uploadPromises);

    // Delete old images from Cloudinary
    if (item.images && item.images.length > 0) {
      for (const oldImageUrl of item.images) {
        const oldPublicId = getPublicIdFromUrl(oldImageUrl);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      }
    }

    // Update the item's images (replace with new images)
    item.images = newImageUrls;
    await item.save();

    res.status(200).json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        id: item._id,
        images: newImageUrls
      }
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};
