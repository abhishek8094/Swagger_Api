const Carousel = require('../models/Carousel');
const path = require('path');
const fs = require('fs');

// @desc    Get all carousel images
// @route   GET /api/carousel
// @access  Public
exports.getCarouselImages = async (req, res, next) => {
  try {
const carouselImages = await Carousel.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('imageUrl');

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const images = carouselImages.map(item => ({
      id: item._id,
      imageUrl: `${baseUrl}${item.imageUrl}`
    }));

    res.status(200).json({
      success: true,
      message: 'Carousel images retrieved successfully',
      data: images
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Add carousel image (upload image)
// @route   POST /api/carousel
// @access  Public
exports.addCarouselImage = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      const error = new Error('Please upload an image');
      error.statusCode = 400;
      return next(error);
    }

    // Create image URL
    const imageUrl = `/uploads/${req.file.filename}`;

    // Save to Carousel collection
    const carouselImage = await Carousel.create({
      imageUrl
    });

    res.status(201).json({
      success: true,
      message: 'Carousel image uploaded successfully',
      data: {
        id: carouselImage._id,
        imageUrl: imageUrl
      }
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Update carousel image
// @route   POST /api/carousel/update
// @access  Public
exports.updateCarouselImage = async (req, res, next) => {
  try {
    const carouselImage = await Carousel.findById(req.body.id);

    if (!carouselImage) {
      const error = new Error('Carousel image not found');
      error.statusCode = 404;
      return next(error);
    }

    // If new image uploaded, update image URL
    if (req.file) {
      const newImageUrl = `/uploads/${req.file.filename}`;

      // Delete old image file
      if (carouselImage.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', 'public', carouselImage.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      carouselImage.imageUrl = newImageUrl;
    }

    await carouselImage.save();

    res.status(200).json({
      success: true,
      message: 'Carousel image updated successfully',
      data: {
        imageUrl: carouselImage.imageUrl
      }
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete carousel image
// @route   POST /api/carousel/delete
// @access  Public
exports.deleteCarouselImage = async (req, res, next) => {
  try {
    const carouselImage = await Carousel.findById(req.body.id);

    if (!carouselImage) {
      const error = new Error('Carousel image not found');
      error.statusCode = 404;
      return next(error);
    }

    // Delete image file
    if (carouselImage.imageUrl) {
      const imagePath = path.join(__dirname, '..', 'public', carouselImage.imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Carousel.findByIdAndDelete(req.body.id);

    res.status(200).json({
      success: true,
      message: 'Carousel image deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};
