const express = require('express');
const {
  createOfferStrip,
  updateOfferStrip,
  deleteOfferStrip,
  getOfferStrip
} = require('../controllers/productController');

const router = express.Router();

/**
 * @swagger
 * /api/offerstrip:
 *   post:
 *     summary: Create or update offerStrip text for a product
 *     tags: [OfferStrip]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - offerStrip
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The product ID
 *               offerStrip:
 *                 type: string
 *                 description: The offer strip text (max 200 characters)
 *             example:
 *               productId: "64f1234567890abcdef12345"
 *               offerStrip: "Special 20% off today!"
 *     responses:
 *       201:
 *         description: Offer strip created/updated successfully
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
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', createOfferStrip);

/**
 * @swagger
 * /api/offerstrip/{id}:
 *   get:
 *     summary: Get offerStrip text for a product
 *     tags: [OfferStrip]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id
 *     responses:
 *       200:
 *         description: Offer strip retrieved successfully
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
 *                     offerStrip:
 *                       type: string
 *                       description: The offer strip text
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getOfferStrip);

/**
 * @swagger
 * /api/offerstrip/{id}:
 *   post:
 *     summary: Update offerStrip text for a product
 *     tags: [OfferStrip]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               offerStrip:
 *                 type: string
 *                 description: The offer strip text (max 200 characters)
 *             example:
 *               offerStrip: "Special 20% off today!"
 *     responses:
 *       200:
 *         description: Offer strip updated successfully
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
 *         description: Invalid offer strip text
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id', updateOfferStrip);

/**
 * @swagger
 * /api/offerstrip/delete/{id}:
 *   post:
 *     summary: Delete offerStrip text for a product
 *     tags: [OfferStrip]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The id
 *     responses:
 *       200:
 *         description: Offer strip deleted successfully
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
router.post('/delete/:id', deleteOfferStrip);

module.exports = router;
