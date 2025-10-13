const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

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
      .select('_id name description price image subImg category');

    const trendingProducts = products.map(product => ({
      id: product._id,
      title: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      subImg: product.subImg,
      category: product.category
    }));

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

    res.status(200).json({
      success: true,
      data: product
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
    if (!size || !['S', 'M', 'L', 'XL'].includes(size)) {
      const error = new Error('Please add a valid product size (S, M, L, XL)');
      error.statusCode = 400;
      return next(error);
    }

    // Check if file was uploaded
    if (!req.files || !req.files.image || req.files.image.length === 0) {
      const error = new Error('Please upload an image');
      error.statusCode = 400;
      return next(error);
    }

    // Upload image to Cloudinary
    const imageResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'trending' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.files.image[0].buffer);
    });

    const imageUrl = imageResult.secure_url;

    // Upload subImg to Cloudinary if uploaded
    let subImgUrl = null;
    if (req.files && req.files.subImg && req.files.subImg.length > 0) {
      const subImgResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'trending' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.subImg[0].buffer);
      });
      subImgUrl = subImgResult.secure_url;
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      size,
      category,
      image: imageUrl,
      subImg: subImgUrl,
      isTrending: true
    });

    res.status(201).json({
      success: true,
      data: product
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
    if (size && !['S', 'M', 'L', 'XL'].includes(size)) {
      const error = new Error('Please add a valid product size (S, M, L, XL)');
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

    // If new image uploaded, update image URL
    if (req.files && req.files.image && req.files.image.length > 0) {
      // Upload new image to Cloudinary
      const imageResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'trending' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.image[0].buffer);
      });

      const newImageUrl = imageResult.secure_url;

      // Delete old image from Cloudinary
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.image) {
        const oldPublicId = getPublicIdFromUrl(oldProduct.image);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      }

      updateData.image = newImageUrl;
    }

    // If new subImg uploaded, update subImg URL
    if (req.files && req.files.subImg && req.files.subImg.length > 0) {
      // Upload new subImg to Cloudinary
      const subImgResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'trending' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.subImg[0].buffer);
      });

      const newSubImgUrl = subImgResult.secure_url;

      // Delete old subImg from Cloudinary
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.subImg) {
        const oldPublicId = getPublicIdFromUrl(oldProduct.subImg);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
        }
      }

      updateData.subImg = newSubImgUrl;
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

    res.status(200).json({
      success: true,
      data: product
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

    // Delete image from Cloudinary
    if (product.image) {
      const publicId = getPublicIdFromUrl(product.image);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // Delete subImg from Cloudinary
    if (product.subImg) {
      const publicId = getPublicIdFromUrl(product.subImg);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
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