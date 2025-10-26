const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getAccessories,
  getAccessory,
  createAccessory,
  updateAccessory,
  deleteAccessory
} = require('../controllers/accessoryController');

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
 *     Accessory:
 *       type: object
 *       required:
 *       - name
 *       - price
 *       - image
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the accessory
 *         name:
 *           type: string
 *           description: The accessory name
 *         price:
 *           type: number
 *           description: The accessory price
 *         image:
 *           type: string
 *           description: The URL of the accessory image
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the accessory was created
 *       example:
 *         id: d5fE_asz
 *         name: Sample Accessory
 *         price: 19.99
 *         image: https://cloudinary.com/accessories/sample.jpg
 *         createdAt: 2023-10-01T10:00:00.000Z
 */

/**
 * @swagger
 * tags:
 *   name: Accessories
 *   description: Accessory management
 */

/**
 * @swagger
 * /api/accessories:
 *   get:
 *     summary: Get all accessories
 *     tags: [Accessories]
 *     responses:
 *       200:
 *         description: Accessories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Accessory'
 *       400:
 *         description: Bad request
 */
router.get('/', getAccessories);

/**
 * @swagger
 * /api/accessories/{id}:
 *   get:
 *     summary: Get single accessory
 *     tags: [Accessories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The accessory id
 *     responses:
 *       200:
 *         description: Accessory retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Accessory'
 *       404:
 *         description: Accessory not found
 */
router.get('/:id', getAccessory);

/**
 * @swagger
 * /api/accessories:
 *   post:
 *     summary: Create new accessory with single image upload
 *     tags: [Accessories]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: Accessory name
 *               price:
 *                 type: number
 *                 description: Accessory price
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Single accessory image file
 *     responses:
 *       201:
 *         description: Accessory created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Accessory'
 *       400:
 *         description: Bad request
 */
router.post('/', upload.single('image'), createAccessory);

/**
 * @swagger
 * /api/accessories/update/{id}:
 *   post:
 *     summary: Update accessory
 *     tags: [Accessories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The accessory id
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Accessory name
 *               price:
 *                 type: number
 *                 description: Accessory price
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New accessory image files (optional, multiple allowed)
 *     responses:
 *       200:
 *         description: Accessory updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Accessory'
 *       404:
 *         description: Accessory not found
 */
router.post('/update/:id', upload.array('images', 10), updateAccessory);

/**
 * @swagger
 * /api/accessories/delete/{id}:
 *   post:
 *     summary: Delete accessory
 *     tags: [Accessories]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The accessory id
 *     responses:
 *       200:
 *         description: Accessory deleted successfully
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
 *         description: Accessory not found
 */
router.post('/delete/:id', deleteAccessory);

module.exports = router;
