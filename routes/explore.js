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
 *         image: https://res.cloudinary.com/your-cloud-name/image/upload/v123456789/explore/explore-123456789.jpg
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
 *     summary: Get explore collection grouped by category
 *     tags: [Explore]
 *     responses:
 *       200:
 *         description: Explore collection retrieved successfully, grouped by category
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
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         title:
 *                           type: string
 *                         price:
 *                           type: number
 *                         image:
 *                           type: string
 *                         category:
 *                           type: string
 *             example:
 *               success: true
 *               message: "Discover premium fitness wear for every workout"
 *               data:
 *                 "Compression Fit": []
 *                 "T-Shirts":
 *                   - id: "60d5ecb74b24c72b8c8b4567"
 *                     title: "Compression T-Shirt"
 *                     price: 29.99
 *                     image: "https://res.cloudinary.com/your-cloud-name/image/upload/v123456789/products/tshirt-123.jpg"
 *                     category: "T-Shirts"
 *                 "Joggers":
 *                   - id: "60d5ecb74b24c72b8c8b4568"
 *                     title: "Slim Fit Joggers"
 *                     price: 49.99
 *                     image: "https://res.cloudinary.com/your-cloud-name/image/upload/v123456789/products/joggers-456.jpg"
 *                     category: "Joggers"
 *                 "Shorts": []
 *                 "Stringers": []
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
