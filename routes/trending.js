const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getTrendingProducts,
  getTrendingProduct,
  createTrendingProduct,
  updateTrendingProduct,
  deleteTrendingProduct
} = require('../controllers/trendingController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads');
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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
 * tags:
 *   name: Trending
 *   description: Trending products management
 */

/**
 * @swagger
 * /api/trending:
 *   get:
 *     summary: Get trending products (top 10 recent products)
 *     tags: [Trending]
 *     responses:
 *       200:
 *         description: Trending products retrieved successfully
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
 *                       title:
 *                         type: string
 *                         description: Product title (name)
 *                       description:
 *                         type: string
 *                         description: Product description
 *                       price:
 *                         type: number
 *                         description: Product price
 *                       image:
 *                         type: string
 *                         description: Product image URL
 *                       subImg:
 *                         type: string
 *                         description: Product sub image URL
 *                       category:
 *                         type: string
 *                         description: Product category
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getTrendingProducts);

/**
 * @swagger
 * /api/trending:
 *   post:
 *     summary: Create new trending product with image upload
 *     tags: [Trending]
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
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Product description
 *               price:
 *                 type: number
 *                 description: Product price
 *               category:
 *                 type: string
 *                 description: Product category
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image file
 *               subImg:
 *                 type: string
 *                 format: binary
 *                 description: Product sub image file (optional)
 *     responses:
 *       201:
 *         description: Product created for trending collection successfully
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
router.post('/', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'subImg', maxCount: 1 }
]), createTrendingProduct);

/**
 * @swagger
 * /api/trending/{id}:
 *   get:
 *     summary: Get single trending product
 *     tags: [Trending]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The trending product id
 *     responses:
 *       200:
 *         description: Trending product retrieved successfully
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
 *         description: Trending product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getTrendingProduct);

/**
 * @swagger
 * /api/trending/update/{id}:
 *   post:
 *     summary: Update trending product
 *     tags: [Trending]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The trending product id
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Product name
 *               description:
 *                 type: string
 *                 description: Product description
 *               price:
 *                 type: number
 *                 description: Product price
 *               category:
 *                 type: string
 *                 description: Product category
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New product image file (optional)
 *               subImg:
 *                 type: string
 *                 format: binary
 *                 description: New product sub image file (optional)
 *     responses:
 *       200:
 *         description: Trending product updated successfully
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
 *         description: Trending product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/update/:id', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'subImg', maxCount: 1 }
]), updateTrendingProduct);

/**
 * @swagger
 * /api/trending/delete/{id}:
 *   post:
 *     summary: Delete trending product
 *     tags: [Trending]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The trending product id
 *     responses:
 *       200:
 *         description: Trending product deleted successfully
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
 *         description: Trending product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/delete/:id', deleteTrendingProduct);

module.exports = router;