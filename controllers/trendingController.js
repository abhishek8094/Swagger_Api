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
      return {
        id: productObj._id,
        title: productObj.name,
        description: productObj.description,
        price: productObj.price,
        image: productObj.image,
        subImg: productObj.subImg,
        images: productObj.images && productObj.images.length > 0 ? transformProductImages(productObj) : [],
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
    productObj.images = productObj.images && productObj.images.length > 0 ? transformProductImages(productObj) : [];

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
    if (!req.files || !req.files.image || req.files.image.length === 0) {
      const error = new Error('Please upload an image');
      error.statusCode = 400;
      return next(error);
    }

    const imageFiles = req.files.image;
    const subImgFile = req.files.subImg ? req.files.subImg[0] : null;

    // Upload all images to Cloudinary
    const uploadPromises = imageFiles.map(file =>
      new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'trending' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(file.buffer);
      })
    );

    const imageResults = await Promise.all(uploadPromises);

    // Upload subImg if provided
    let subImgUrl = null;
    if (subImgFile) {
      const subImgResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'trending' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(subImgFile.buffer);
      });
      subImgUrl = subImgResult.secure_url;
    }

    // Create images array with objects {id, url}
    const imagesArray = imageResults.map(result => ({
      id: crypto.randomUUID(),
      url: result.secure_url
    }));

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      size,
      category,
      image: imageResults[0].secure_url, // Main image is the first uploaded image
      subImg: subImgUrl,
      images: imagesArray,
      isTrending: true
    });

    // Transform images to ensure array of objects
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
    if (req.files && req.files.image && req.files.image.length > 0) {
      const imageFiles = req.files.image;

      // Upload new images to Cloudinary
      const uploadPromises = imageFiles.map(file =>
        new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'trending' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        })
      );

      const imageResults = await Promise.all(uploadPromises);

      // Delete old images from Cloudinary
      if (existingProduct.images && existingProduct.images.length > 0) {
        const deletePromises = existingProduct.images.map(img => {
          if (typeof img === 'string') {
            const publicId = getPublicIdFromUrl(img);
            if (publicId) {
              return cloudinary.uploader.destroy(publicId);
            }
          } else if (img.url) {
            const publicId = getPublicIdFromUrl(img.url);
            if (publicId) {
              return cloudinary.uploader.destroy(publicId);
            }
          }
          return Promise.resolve();
        });
        await Promise.all(deletePromises);
      }

      // Create new images array
      const imagesArray = imageResults.map(result => ({
        id: crypto.randomUUID(),
        url: result.secure_url
      }));

      updateData.image = imageResults[0].secure_url; // Main image is the first uploaded image
      updateData.images = imagesArray;
    }

    // If new subImg uploaded, update subImg
    if (req.files && req.files.subImg && req.files.subImg.length > 0) {
      const subImgFile = req.files.subImg[0];

      // Upload new subImg to Cloudinary
      const subImgResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'trending' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(subImgFile.buffer);
      });

      // Delete old subImg from Cloudinary
      if (existingProduct.subImg) {
        const oldSubImgPublicId = getPublicIdFromUrl(existingProduct.subImg);
        if (oldSubImgPublicId) {
          await cloudinary.uploader.destroy(oldSubImgPublicId);
        }
      }

      updateData.subImg = subImgResult.secure_url;
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

    // Transform images to ensure array of objects
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

    // Delete all images from Cloudinary
    if (product.images && product.images.length > 0) {
      const deletePromises = product.images.map(img => {
        if (typeof img === 'string') {
          const publicId = getPublicIdFromUrl(img);
          if (publicId) {
            return cloudinary.uploader.destroy(publicId);
          }
        } else if (img.url) {
          const publicId = getPublicIdFromUrl(img.url);
          if (publicId) {
            return cloudinary.uploader.destroy(publicId);
          }
        }
        return Promise.resolve();
      });
      await Promise.all(deletePromises);
    }

    // Delete subImg from Cloudinary
    if (product.subImg) {
      const subImgPublicId = getPublicIdFromUrl(product.subImg);
      if (subImgPublicId) {
        await cloudinary.uploader.destroy(subImgPublicId);
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
