const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  uploadVideo,
  updateVideo,
  deleteVideo,
  getAllVideos,
  getVideo
} = require('../controllers/videoController');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.memoryStorage();

// File filter for videos only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for short videos
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Video:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: The video title
 *         video:
 *           type: string
 *           format: binary
 *           description: Video file
 */

/**
 * @swagger
 * tags:
 *   name: VideoUpload
 *   description: Video upload management
 */

/**
 * @swagger
 * /api/videoupload:
 *   post:
 *     summary: Upload a video
 *     tags: [VideoUpload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - video
 *             properties:
 *               title:
 *                 type: string
 *                 description: Video title
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', upload.single('video'), uploadVideo);

/**
 * @swagger
 * /api/videoupload:
 *   get:
 *     summary: Get all videos
 *     tags: [VideoUpload]
 *     responses:
 *       200:
 *         description: Videos retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                   description: Number of videos
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getAllVideos);

/**
 * @swagger
 * /api/videoupload/{id}:
 *   get:
 *     summary: Get a single video
 *     tags: [VideoUpload]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The video ID
 *     responses:
 *       200:
 *         description: Video retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getVideo);

/**
 * @swagger
 * /api/videoupload/{id}:
 *   put:
 *     summary: Update a video
 *     tags: [VideoUpload]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The video ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Video title
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file
 *     responses:
 *       200:
 *         description: Video updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', upload.single('video'), updateVideo);

/**
 * @swagger
 * /api/videoupload/{id}:
 *   delete:
 *     summary: Delete a video
 *     tags: [VideoUpload]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The video ID
 *     responses:
 *       200:
 *         description: Video deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Video not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', deleteVideo);





module.exports = router;
