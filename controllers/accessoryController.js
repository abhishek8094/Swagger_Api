const Accessory = require('../models/Accessory');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

// Helper function to ensure images is an array of strings
const transformProductImages = (productObj) => {
  if (Array.isArray(productObj.images)) {
    // Check if images are objects {id, url}
    if (productObj.images.length > 0 && typeof productObj.images[0] === 'object' && productObj.images[0].url) {
      return productObj.images.map(img => img.url);
    } else {
      return productObj.images;
    }
  } else if (typeof productObj.images === 'string' && productObj.images.trim() !== '') {
    // Backward compatibility: split string into array
    return productObj.images.split(', ').map(url => url.trim());
  } else {
    return [];
  }
};

// @desc    Get all accessories
// @route   GET /api/accessories
// @access  Public
exports.getAccessories = async (req, res, next) => {
  try {
    const accessories = await Accessory.find().sort({ createdAt: -1 });

    // Transform images to ensure array of strings
    const accessoriesWithImagesArray = accessories.map(accessory => {
      const accessoryObj = accessory.toObject();
      accessoryObj.images = transformProductImages(accessoryObj);
      return accessoryObj;
    });

    res.status(200).json({
      success: true,
      count: accessoriesWithImagesArray.length,
      data: accessoriesWithImagesArray
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

    // Transform images to ensure array of strings
    const accessoryWithImagesArray = accessory.toObject();
    accessoryWithImagesArray.images = transformProductImages(accessoryWithImagesArray);

    res.status(200).json({
      success: true,
      data: accessoryWithImagesArray
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

    // Validate that at least one image is uploaded
    if (!req.files || !req.files.images || req.files.images.length === 0) {
      const error = new Error('Please upload at least one image');
      error.statusCode = 400;
      return next(error);
    }

    // Upload images to Cloudinary if provided
    const imageObjects = [];
    if (req.files && req.files.images && req.files.images.length > 0) {
      for (const file of req.files.images) {
        const imageResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'accessories' },
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
    }

    const accessory = await Accessory.create({
      name,
      price: parseFloat(price),
      images: imageObjects
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

    // If new images uploaded, update images
    if (req.files && req.files.images && req.files.images.length > 0) {
      // Upload new images to Cloudinary
      const newImageUrls = [];
      for (const file of req.files.images) {
        const imageResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'accessories' },
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
      const oldAccessory = await Accessory.findById(req.params.id);
      if (oldAccessory && oldAccessory.images && oldAccessory.images.length > 0) {
        for (const oldImageUrl of oldAccessory.images) {
          const oldPublicId = getPublicIdFromUrl(oldImageUrl);
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId);
          }
        }
      }

      updateData.images = newImageUrls;
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

    // Delete images from Cloudinary
    if (accessory.images && accessory.images.length > 0) {
      for (const imageUrl of accessory.images) {
        const publicId = getPublicIdFromUrl(imageUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
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
