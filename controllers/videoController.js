const Video = require('../models/Video');
const cloudinary = require('../config/cloudinary');

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z]+$/);
  return match ? match[1] : null;
};

// @desc    Upload video
// @route   POST /api/videoupload
// @access  Public
exports.uploadVideo = async (req, res, next) => {
  try {
    const { title } = req.body;

    // Validate required fields
    if (!title) {
      const error = new Error('Title is required');
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

    const video = await Video.create({
      title,
      videoUrl
    });

    res.status(201).json({
      success: true,
      data: video
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get all videos
// @route   GET /api/videoupload
// @access  Public
exports.getAllVideos = async (req, res, next) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });

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

// @desc    Get single video
// @route   GET /api/videoupload/:id
// @access  Public
exports.getVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      const error = new Error('Video not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Update video
// @route   POST /api/videoupload/:id/update
// @access  Public
exports.updateVideo = async (req, res, next) => {
  try {
    const { title } = req.body;

    let updateData = {};

    if (title) {
      updateData.title = title;
    }

    // If new video uploaded, update video
    if (req.file) {
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
      const oldVideo = await Video.findById(req.params.id);
      if (oldVideo && oldVideo.videoUrl) {
        const oldPublicId = getPublicIdFromUrl(oldVideo.videoUrl);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'video' });
        }
      }

      updateData.videoUrl = newVideoUrl;
    }

    const video = await Video.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!video) {
      const error = new Error('Video not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Delete video
// @route   POST /api/videoupload/:id/delete
// @access  Public
exports.deleteVideo = async (req, res, next) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      const error = new Error('Video not found');
      error.statusCode = 404;
      return next(error);
    }

    // Delete video from Cloudinary
    if (video.videoUrl) {
      const publicId = getPublicIdFromUrl(video.videoUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
      }
    }

    await Video.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};
