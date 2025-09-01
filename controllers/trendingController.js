const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

// @desc    Get trending products (top 10 recent products)
// @route   GET /api/trending
// @access  Public
exports.getTrendingProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name description price imageUrl subImg category');

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const trendingProducts = products.map(product => ({
      title: product.name,
      description: product.description,
      price: product.price,
      image: product.imageUrl ? (product.imageUrl.startsWith('http') ? product.imageUrl : `${baseUrl}${product.imageUrl}`) : null,
      subImg: product.subImg ? (product.subImg.startsWith('http') ? product.subImg : `${baseUrl}${product.subImg}`) : null,
      category: product.category
    }));

    res.status(200).json({
      success: true,
      message: 'Trending products retrieved successfully',
      data: trendingProducts
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single trending product
// @route   GET /api/trending/:id
// @access  Public
exports.getTrendingProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Trending product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new trending product with image upload
// @route   POST /api/trending
// @access  Public
exports.createTrendingProduct = async (req, res, next) => {
  try {
    const { name, description, price, category } = req.body;

    // Check if file was uploaded
    if (!req.files || !req.files.image || req.files.image.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    // Create full image URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/${req.files.image[0].filename}`;

    // Create subImg URL if uploaded
    let subImgUrl = null;
    if (req.files && req.files.subImg) {
      subImgUrl = `${baseUrl}/uploads/${req.files.subImg[0].filename}`;
    }

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      category,
      imageUrl,
      subImg: subImgUrl,
      isTrending: true
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update trending product
// @route   PUT /api/trending/:id
// @access  Public
exports.updateTrendingProduct = async (req, res, next) => {
  try {
    const { name, description, price, category } = req.body;

    let updateData = {
      name,
      description,
      price: parseFloat(price),
      category
    };

    // If new image uploaded, update image URL
    if (req.files && req.files.image && req.files.image.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      updateData.imageUrl = `${baseUrl}/uploads/${req.files.image[0].filename}`;

      // Delete old image file if exists
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', 'public', oldProduct.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    // If new subImg uploaded, update subImg URL
    if (req.files && req.files.subImg) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      updateData.subImg = `${baseUrl}/uploads/${req.files.subImg[0].filename}`;

      // Delete old subImg file if exists
      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.subImg) {
        const oldSubImgPath = path.join(__dirname, '..', 'public', oldProduct.subImg);
        if (fs.existsSync(oldSubImgPath)) {
          fs.unlinkSync(oldSubImgPath);
        }
      }
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
      return res.status(404).json({
        success: false,
        message: 'Trending product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete trending product
// @route   DELETE /api/trending/:id
// @access  Public
exports.deleteTrendingProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Trending product not found'
      });
    }

    // Delete image file
    if (product.imageUrl) {
      const imagePath = path.join(__dirname, '..', 'public', product.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete subImg file
    if (product.subImg) {
      const subImgPath = path.join(__dirname, '..', 'public', product.subImg);
      if (fs.existsSync(subImgPath)) {
        fs.unlinkSync(subImgPath);
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Trending product deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
