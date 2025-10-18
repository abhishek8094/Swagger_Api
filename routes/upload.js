const express = require('express');
const multer = require('multer');
const path = require('path');
const { uploadImages } = require('../controllers/uploadController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     UploadResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the updated resource
 *             images:
 *               type: array
 *               items:
 *                 type: string
 *               description: The uploaded image URLs
 */

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Image upload management for various resources
 */

/**
 * @swagger
 * /api/upload/{id}:
 *   post:
 *     summary: Upload multiple images for a specific item by ID
 *     tags: [Upload]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the item to update (Product or Accessory)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: The image files to upload (up to 10)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: Bad request (no images uploaded, etc.)
 *       404:
 *         description: Item not found
 */
router.post('/:id', upload.array('images', 10), uploadImages);

module.exports = router;
