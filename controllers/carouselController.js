const Carousel = require('../models/Carousel');
const cloudinary = require('../config/cloudinary');

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

// @desc    Get all carousel images
// @route   GET /api/carousel
// @access  Public
exports.getCarouselImages = async (req, res, next) => {
  try {
const carouselImages = await Carousel.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('imageUrl');

    const images = carouselImages.map(item => ({
      id: item._id,
      imageUrl: item.imageUrl
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

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'carousel' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const imageUrl = result.secure_url;

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
      // Upload new to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'carousel' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      const newImageUrl = result.secure_url;

      // Delete old from Cloudinary
      if (carouselImage.imageUrl) {
        const oldPublicId = getPublicIdFromUrl(carouselImage.imageUrl);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId);
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

    // Delete image from Cloudinary
    if (carouselImage.imageUrl) {
      const publicId = getPublicIdFromUrl(carouselImage.imageUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
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