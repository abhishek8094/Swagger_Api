const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getExploreCollection,
  getExploreProduct,
  createExploreProduct,
  updateExploreProduct,
  deleteExploreProduct
} = require('../controllers/exploreController');

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
 * components:
 *   schemas:
 *     ExploreProduct:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - image
 *         - category
 *         - size
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the explore product
 *         name:
 *           type: string
 *           description: The product name
 *         description:
 *           type: string
 *           description: The product description
 *         price:
 *           type: number
 *           description: The product price
 *         image:
 *           type: string
 *           description: The URL of the product image
 *         category:
 *           type: string
 *           description: The product category
 *         size:
 *           type: string
 *           enum: [S, M, L, XL]
 *           description: The product size
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the product was created
 *       example:
 *         id: d5fE_asz
 *         name: Compression Fit T-Shirt
 *         description: Premium compression fit for optimal performance
 *         price: 39.99
 *         image: http://localhost:3001/uploads/explore-123456789.jpg
 *         category: "Compression Fit"
 *         size: "M"
 *         createdAt: 2023-10-01T10:00:00.000Z
 */

/**
 * @swagger
 * tags:
 *   name: Explore
 *   description: Explore collection management
 */

/**
 * @swagger
 * /api/explore:
 *   get:
 *     summary: Get explore collection with products grouped by categories
 *     tags: [Explore]
 *     responses:
 *       200:
 *         description: Explore collection retrieved successfully
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
 *                     All:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           price:
 *                             type: number
 *                           image:
 *                             type: string
 *                           category:
 *                             type: string
 *                     "Compression Fit":
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           price:
 *                             type: number
 *                           image:
 *                             type: string
 *                           category:
 *                             type: string
 *                     "T-Shirts":
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           price:
 *                             type: number
 *                           image:
 *                             type: string
 *                           category:
 *                             type: string
 *                     Joggers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           price:
 *                             type: number
 *                           image:
 *                             type: string
 *                           category:
 *                             type: string
 *                     Shorts:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           price:
 *                             type: number
 *                           image:
 *                             type: string
 *                           category:
 *                             type: string
 *                     Stringers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           price:
 *                             type: number
 *                           image:
 *                             type: string
 *                           category:
 *                             type: string
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', getExploreCollection);

/**
 * @swagger
 * /api/explore:
 *   post:
 *     summary: Create new product for explore collection with image upload
 *     tags: [Explore]
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
 *               - size
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
 *               size:
 *                 type: string
 *                 enum: [S, M, L, XL]
 *                 description: Product size
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Product image file
 *     responses:
 *       201:
 *         description: Product created for explore collection successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExploreProduct'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', upload.single('image'), createExploreProduct);

/**
 * @swagger
 * /api/explore/{id}:
 *   get:
 *     summary: Get single explore product
 *     tags: [Explore]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The explore product id
 *     responses:
 *       200:
 *         description: Explore product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExploreProduct'
 *       404:
 *         description: Explore product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getExploreProduct);

router.post('/update/:id', upload.single('image'), updateExploreProduct);

/**
 * @swagger
 * /api/explore/update/{id}:
 *   post:
 *     summary: Update explore product
 *     tags: [Explore]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The explore product id
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
 *               size:
 *                 type: string
 *                 enum: [S, M, L, XL]
 *                 description: Product size
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New product image file (optional)
 *     responses:
 *       200:
 *         description: Explore product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ExploreProduct'
 *       404:
 *         description: Explore product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @swagger
 * /api/explore/delete/{id}:
 *   post:
 *     summary: Delete explore product
 *     tags: [Explore]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The explore product id
 *     responses:
 *       200:
 *         description: Explore product deleted successfully
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
 *         description: Explore product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/delete/:id', deleteExploreProduct);

module.exports = router;
