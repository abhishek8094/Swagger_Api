const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  uploadVideo,
  updateVideo,
  deleteVideo,
  getVideo
} = require('../controllers/productController');

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
 *     VideoUpload:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: The product ID
 *         video:
 *           type: string
 *           format: binary
 *           description: Video file
 */

/**
 * @swagger
 * tags:
 *   name: VideoUpload
 *   description: Video upload management for products
 */

/**
 * @swagger
 * /api/videoupload:
 *   post:
 *     summary: Upload video for a product
 *     tags: [VideoUpload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - video
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The product ID
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
 *                   $ref: '#/components/schemas/Product'
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
 * /api/videoupload/{id}:
 *   get:
 *     summary: Get video for a product
 *     tags: [VideoUpload]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id
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
 *                   type: object
 *                   properties:
 *                     video:
 *                       type: string
 *                       description: The video URL
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getVideo);

/**
 * @swagger
 * /api/videoupload/{id}:
 *   post:
 *     summary: Update video for a product
 *     tags: [VideoUpload]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: New video file
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
 *                   $ref: '#/components/schemas/Product'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id', upload.single('video'), updateVideo);

/**
 * @swagger
 * /api/videoupload/delete/{id}:
 *   post:
 *     summary: Delete video for a product
 *     tags: [VideoUpload]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id
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
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *                 message:
 *                   type: string
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/delete/:id', deleteVideo);

module.exports = router;
