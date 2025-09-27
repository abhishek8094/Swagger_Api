const express = require('express');
const {
  getAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/addressController');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Address:
 *       type: object
 *       required:
 *       - countryRegion
 *       - firstName
 *       - lastName
 *       - address
 *       - city
 *       - state
 *       - pinCode
 *       - phone
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the address
 *         countryRegion:
 *           type: string
 *           description: The country or region
 *         firstName:
 *           type: string
 *           description: The first name
 *         lastName:
 *           type: string
 *           description: The last name
 *         address:
 *           type: string
 *           description: The address
 *         apartmentSuite:
 *           type: string
 *           description: Apartment, suite, etc. (optional)
 *         city:
 *           type: string
 *           description: The city
 *         state:
 *           type: string
 *           description: The state
 *         pinCode:
 *           type: string
 *           description: The PIN code
 *         phone:
 *           type: string
 *           description: The phone number
 *         defaultAddress:
 *           type: boolean
 *           description: Whether this is the default address
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the address was created
 *       example:
 *         id: d5fE_asz
 *         countryRegion: Afghanistan
 *         firstName: First name
 *         lastName: Last name
 *         address: Address
 *         apartmentSuite: Apartment, suite, etc (optional)
 *         city: City
 *         state: Andaman and Nicobar Islands
 *         pinCode: PIN code
 *         phone: +91 Phone
 *         defaultAddress: false
 *         createdAt: 2023-10-01T10:00:00.000Z
 */

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Address management
 */

/**
 * @swagger
 * /api/addresses:
 *   get:
 *     summary: Get all addresses for the authenticated user
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Addresses retrieved successfully
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
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         description: Not authorized to access this route
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, getAddresses);

/**
 * @swagger
 * /api/addresses/{id}:
 *   get:
 *     summary: Get single address for the authenticated user
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The address id
 *     responses:
 *       200:
 *         description: Address retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       401:
 *         description: Not authorized to access this route
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', protect, getAddress);

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: Create new address
 *     tags: [Addresses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - countryRegion
 *               - firstName
 *               - lastName
 *               - address
 *               - city
 *               - state
 *               - pinCode
 *               - phone
 *             properties:
 *               countryRegion:
 *                 type: string
 *                 description: Country or region
 *               firstName:
 *                 type: string
 *                 description: First name
 *               lastName:
 *                 type: string
 *                 description: Last name
 *               address:
 *                 type: string
 *                 description: Address
 *               apartmentSuite:
 *                 type: string
 *                 description: Apartment, suite, etc. (optional)
 *               city:
 *                 type: string
 *                 description: City
 *               state:
 *                 type: string
 *                 description: State
 *               pinCode:
 *                 type: string
 *                 description: PIN code
 *               phone:
 *                 type: string
 *                 description: Phone number
 *               defaultAddress:
 *                 type: boolean
 *                 description: Whether this is the default address
 *     responses:
 *       201:
 *         description: Address created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', protect, createAddress);

/**
 * @swagger
 * /api/addresses/{id}/update:
 *   post:
 *     summary: Update address
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The address id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               countryRegion:
 *                 type: string
 *                 description: Country or region
 *               firstName:
 *                 type: string
 *                 description: First name
 *               lastName:
 *                 type: string
 *                 description: Last name
 *               address:
 *                 type: string
 *                 description: Address
 *               apartmentSuite:
 *                 type: string
 *                 description: Apartment, suite, etc. (optional)
 *               city:
 *                 type: string
 *                 description: City
 *               state:
 *                 type: string
 *                 description: State
 *               pinCode:
 *                 type: string
 *                 description: PIN code
 *               phone:
 *                 type: string
 *                 description: Phone number
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Address'
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/update', protect, updateAddress);

/**
 * @swagger
 * /api/addresses/{id}/delete:
 *   post:
 *     summary: Delete address
 *     tags: [Addresses]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The address id
 *     responses:
 *       200:
 *         description: Address deleted successfully
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
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/delete', protect, deleteAddress);

module.exports = router;