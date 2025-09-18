const express = require('express');
const multer = require('multer');
const {
  getCarouselImages,
  addCarouselImage,
  updateCarouselImage,
  deleteCarouselImage
} = require('../controllers/carouselController');

const router = express.Router();

// Configure multer for file uploads (memory storage for Cloudinary)
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
 *     CarouselImage:
 *       type: object
 *       required:
 *         - imageUrl
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the carousel image
 *         imageUrl:
 *           type: string
 *           description: The URL of the carousel image
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the carousel image was created
 *       example:
 *         id: d5fE_asz
 *         imageUrl: /uploads/carousel-123456789.jpg
 *         createdAt: 2023-10-01T10:00:00.000Z
 */

/**
 * @swagger
 * tags:
 *   name: Carousel
 *   description: Carousel image management
 */

/**
 * @swagger
 * /api/carousel:
 *   get:
 *     summary: Get all carousel images
 *     tags: [Carousel]
 *     responses:
 *       200:
 *         description: Carousel images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The unique ID of the carousel image
 *                       imageUrl:
 *                         type: string
 *                         description: The full URL of the carousel image
 *                     example:
 *                       id: "60d5ecb74b24c72b8c8b4567"
 *                       imageUrl: "https://node-vw5f.onrender.com/uploads/image1.jpg"
 *                   example: [{"id": "60d5ecb74b24c72b8c8b4567", "imageUrl": "https://node-vw5f.onrender.com/uploads/image1.jpg"}]
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getCarouselImages);

/**
 * @swagger
 * /api/carousel:
 *   post:
 *     summary: Upload a new carousel image
 *     tags: [Carousel]
 *     description: |
 *       Uploads a new carousel image file. The image is uploaded to Cloudinary under the 'carousel' folder.
 *       The response returns the secure URL of the uploaded image from Cloudinary, which can be used to display the image.
 *       You can verify the uploaded image in your Cloudinary dashboard under the 'carousel' folder.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Carousel image file
 *       responses:
 *         201:
 *           description: Carousel image uploaded successfully
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   success:
 *                     type: boolean
 *                   message:
 *                     type: string
 *                   data:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: The unique ID of the uploaded carousel image
 *                       imageUrl:
 *                         type: string
 *                         description: URL of the uploaded image
 *                     example:
 *                       id: "60d5ecb74b24c72b8c8b4567"
 *                       imageUrl: "/uploads/image1.jpg"
 *         400:
 *           description: Bad request
 *           content:
 *             application/json:
 *               schema:
 *                 $ref: '#/components/schemas/Error'
 */
router.post('/', upload.single('image'), addCarouselImage);

/**
 * @swagger
 * /api/carousel/update:
 *   post:
 *     summary: Update carousel image
 *     tags: [Carousel]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: The carousel image id
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New carousel image file (optional)
 *     responses:
 *       200:
 *         description: Carousel image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrl:
 *                       type: string
 *                       description: URL of the updated image
 *       404:
 *         description: Carousel image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/update', upload.single('image'), updateCarouselImage);

/**
 * @swagger
 * /api/carousel/delete:
 *   post:
 *     summary: Delete carousel image
 *     tags: [Carousel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: The carousel image id
 *     responses:
 *       200:
 *         description: Carousel image deleted successfully
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
 *         description: Carousel image not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/delete', deleteCarouselImage);

module.exports = router;