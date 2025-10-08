const Accessory = require('../models/Accessory');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

// @desc    Get all accessories
// @route   GET /api/accessories
// @access  Public
exports.getAccessories = async (req, res, next) => {
  try {
    const accessories = await Accessory.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: accessories.length,
      data: accessories
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get single accessory
// @route   GET /api/accessories/:id
// @access  Public
exports.getAccessory = async (req, res, next) => {
  try {
    const accessory = await Accessory.findById(req.params.id);

    if (!accessory) {
      const error = new Error('Accessory not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: accessory
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Create new accessory with image upload
// @route   POST /api/accessories
// @access  Public
exports.createAccessory = async (req, res, next) => {
  try {
    const { name, price } = req.body;

    // Validate required fields
    if (!name || !price) {
      const error = new Error('Please provide name and price');
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
        { folder: 'accessories' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const imageUrl = imageResult.secure_url;

    const accessory = await Accessory.create({
      name,
      price: parseFloat(price),
      image: imageUrl
    });

    res.status(201).json({
      success: true,
      data: accessory
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Update accessory
// @route   POST /api/accessories/update/:id
// @access  Public
exports.updateAccessory = async (req, res, next) => {
  try {
    const { name, price } = req.body;

    let updateData = {
      name,
      price: parseFloat(price)
    };

    // If new image uploaded, update image
    if (req.file) {
      // Upload new image to Cloudinary
      const imageResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'accessories' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const newImageUrl = imageResult.secure_url;

      // Delete old image from Cloudinary
      const oldAccessory = await Accessory.findById(req.params.id);
      if (oldAccessory && oldAccessory.image) {
        const oldPublicId = getPublicIdFromUrl(oldAccessory.image);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      }

      updateData.image = newImageUrl;
    }

    const accessory = await Accessory.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!accessory) {
      const error = new Error('Accessory not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: accessory
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete accessory
// @route   POST /api/accessories/delete/:id
// @access  Public
exports.deleteAccessory = async (req, res, next) => {
  try {
    const accessory = await Accessory.findById(req.params.id);

    if (!accessory) {
      const error = new Error('Accessory not found');
      error.statusCode = 404;
      return next(error);
    }

    // Delete image from Cloudinary
    if (accessory.image) {
      const publicId = getPublicIdFromUrl(accessory.image);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await Accessory.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Accessory deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};
