const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const path = require('path');
const fs = require('fs');
const cloudinary = require('../config/cloudinary');

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

// @desc    Get all products for carousel
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    // Images are already full Cloudinary URLs
    const productsWithFullImage = products.map(product => product.toObject());

    res.status(200).json({
      success: true,
      count: productsWithFullImage.length,
      data: productsWithFullImage
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get single product or accessory
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    // First, try to find in Product model
    let item = await Product.findById(req.params.id);

    if (!item) {
      // If not found in Product, try Accessory model
      item = await Accessory.findById(req.params.id);
    }

    if (!item) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Images are already full Cloudinary URLs
    const itemObj = item.toObject();

    res.status(200).json({
      success: true,
      data: itemObj
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Create new product with image upload
// @route   POST /api/products
// @access  Public
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, isExplore, size, offerStrip } = req.body;

    // Validate required fields
    if (!size) {
      const error = new Error('Please add a product size');
      error.statusCode = 400;
      return next(error);
    }

    // Validate category if provided
    if (!category || typeof category !== 'string' || category.trim() === '') {
      const error = new Error('Please provide a valid category name');
      error.statusCode = 400;
      return next(error);
    }

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
          { folder: 'products' },
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
      size,
      category: category.trim(),
      images: imageUrls,
      isExplore: isExplore || false
    });
    // Images are already full Cloudinary URLs
    const productObj = product.toObject();

    // Transform to match the example response
    const transformedData = {
      id: productObj._id,
      name: productObj.name,
      description: productObj.description,
      price: productObj.price,
      size: productObj.size,
      images: productObj.images,
      createdAt: productObj.createdAt
    };

    res.status(201).json({
      success: true,
      data: transformedData
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Update product
// @route   POST /api/products/update/:id
// @access  Public
exports.updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, category, size, offerStrip } = req.body;

    // Validate size if provided
    if (size && typeof size !== 'string') {
      const error = new Error('Size must be a string');
      error.statusCode = 400;
      return next(error);
    }

    // Validate category if provided
    if (category && (typeof category !== 'string' || category.trim() === '')) {
      const error = new Error('Please provide a valid category name');
      error.statusCode = 400;
      return next(error);
    }

    let updateData = {
      name,
      description,
      price: parseFloat(price),
      category: category ? category.trim() : undefined,
      size
    };

    // If new images uploaded, update images
    if (req.files && req.files.images && req.files.images.length > 0) {
      // Upload new images to Cloudinary
      const newImageUrls = [];
      for (const file of req.files.images) {
        const imageResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'products' },
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
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.images && oldProduct.images.length > 0) {
        for (const oldImageUrl of oldProduct.images) {
          const oldPublicId = getPublicIdFromUrl(oldImageUrl);
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId);
          }
        }
      }

      updateData.images = newImageUrls;
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
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Images are already full Cloudinary URLs
    const productObj = product.toObject();

    res.status(200).json({
      success: true,
      data: productObj
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete product
// @route   POST /api/products/delete/:id
// @access  Public
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const imageUrl of product.images) {
        const publicId = getPublicIdFromUrl(imageUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Create/Update offerStrip for a product
// @route   POST /api/products/:id/offerstrip
// @access  Public
exports.createOfferStrip = async (req, res, next) => {
  try {
    const { offerStrip } = req.body;
    const productId = req.params.id;

    // Validate offerStrip
    if (typeof offerStrip !== 'string' || offerStrip.length > 200) {
      const error = new Error('Offer strip must be a string with maximum 200 characters');
      error.statusCode = 400;
      return next(error);
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { offerStrip: offerStrip.trim() },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Images are already full Cloudinary URLs
    const productObj = product.toObject();

    res.status(201).json({
      success: true,
      data: productObj
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Update offerStrip for a product
// @route   PUT /api/products/:id/offerstrip
// @access  Public
exports.updateOfferStrip = async (req, res, next) => {
  try {
    const { offerStrip } = req.body;
    const productId = req.params.id;

    // Validate productId presence
    if (!productId) {
      const error = new Error('Product ID is required');
      error.statusCode = 400;
      return next(error);
    }

    // Validate offerStrip
    if (typeof offerStrip !== 'string' || offerStrip.length > 200) {
      const error = new Error('Offer strip must be a string with maximum 200 characters');
      error.statusCode = 400;
      return next(error);
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { offerStrip: offerStrip.trim() },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Images are already full Cloudinary URLs
    const productObj = product.toObject();

    res.status(200).json({
      success: true,
      data: productObj
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete offerStrip for a product
// @route   DELETE /api/products/:id/offerstrip
// @access  Public
exports.deleteOfferStrip = async (req, res, next) => {
  try {
    const productId = req.params.id;

    // Validate productId presence
    if (!productId) {
      const error = new Error('Product ID is required');
      error.statusCode = 400;
      return next(error);
    }

    const product = await Product.findByIdAndUpdate(
      productId,
      { offerStrip: '' },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Images are already full Cloudinary URLs
    const productObj = product.toObject();

    res.status(200).json({
      success: true,
      data: productObj,
      message: 'Offer strip deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get offerStrip for all products
// @route   GET /api/products/offerstrip
// @access  Public
exports.getAllOfferStrips = async (req, res, next) => {
  try {
    const products = await Product.find().select('_id offerStrip');

    res.status(200).json({
      success: true,
      data: products.map(product => ({
        _id: product._id,
        offerStrip: product.offerStrip || ''
      }))
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get offerStrip for a product
// @route   GET /api/products/:id/offerstrip
// @access  Public
exports.getOfferStrip = async (req, res, next) => {
  try {
    const productId = req.params.id;

    // Get offerStrip for a specific product
    const product = await Product.findById(productId).select('_id offerStrip');

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: product._id,
        offerStrip: product.offerStrip || ''
      }
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Search products
// @route   GET /api/products/search
// @access  Public
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, category } = req.query;

    let query = {};

    // Search by name or description
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    // Images are already full Cloudinary URLs
    const productsWithFullImage = products.map(product => product.toObject());

    res.status(200).json({
      success: true,
      count: productsWithFullImage.length,
      data: productsWithFullImage
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Upload video for a product
// @route   POST /api/videoupload/:productId
// @access  Public
exports.uploadVideo = async (req, res, next) => {
  try {
    const { productId } = req.params;

    // Validate required fields
    if (!productId) {
      const error = new Error('Product ID is required');
      error.statusCode = 400;
      return next(error);
    }

    // Check if file was uploaded
    if (!req.file) {
      const error = new Error('Please upload a video');
      error.statusCode = 400;
      return next(error);
    }

    // Upload video to Cloudinary
    const videoResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'videos', resource_type: 'video' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const videoUrl = videoResult.secure_url;

    const product = await Product.findByIdAndUpdate(
      productId,
      { video: videoUrl },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Images are already full Cloudinary URLs
    const productObj = product.toObject();

    res.status(201).json({
      success: true,
      data: productObj
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Update video for a product
// @route   POST /api/videoupload/:productId
// @access  Public
exports.updateVideo = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      const error = new Error('Please upload a video');
      error.statusCode = 400;
      return next(error);
    }

    // Upload new video to Cloudinary
    const videoResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'videos', resource_type: 'video' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const newVideoUrl = videoResult.secure_url;

    // Delete old video from Cloudinary
    const oldProduct = await Product.findById(req.params.productId);
    if (oldProduct && oldProduct.video) {
      const oldPublicId = getPublicIdFromUrl(oldProduct.video);
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'video' });
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.productId,
      { video: newVideoUrl },
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Images are already full Cloudinary URLs
    const productObj = product.toObject();

    res.status(200).json({
      success: true,
      data: productObj
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete video for a product
// @route   DELETE /api/videoupload/:productId
// @access  Public
exports.deleteVideo = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);

    if (!product) {
      const error = new Error('Product not found');
      error.statusCode = 404;
      return next(error);
    }

    // Delete video from Cloudinary
    if (product.video) {
      const publicId = getPublicIdFromUrl(product.video);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.productId,
      { video: '' },
      {
        new: true,
        runValidators: true
      }
    );

    // Images are already full Cloudinary URLs
    const productObj = updatedProduct.toObject();

    res.status(200).json({
      success: true,
      data: productObj,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get all videos for products
// @route   GET /api/videoupload
// @access  Public
exports.getAllVideos = async (req, res, next) => {
  try {
    const products = await Product.find().select('_id video');

    const videos = products.map(product => ({
      id: product._id,
      video: product.video || ''
    }));

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};
