const express = require('express');
const {
  addOrder,
  getOrder,
  getUserOrders,
  updateOrderStatus
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - user
 *         - products
 *         - shippingAddress
 *         - paymentMethod
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the order
 *         orderId:
 *           type: string
 *           description: The unique order identifier
 *         user:
 *           type: string
 *           description: The user ID who placed the order
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product ID
 *               quantity:
 *                 type: integer
 *                 description: Quantity of the product
 *               price:
 *                 type: number
 *                 description: Price per unit at the time of order
 *         totalAmount:
 *           type: number
 *           description: Total amount of the order
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *           description: Current status of the order
 *         shippingAddress:
 *           type: string
 *           description: Shipping address ID
 *         paymentMethod:
 *           type: string
 *           description: Payment method used
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           description: Payment status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the order was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the order was updated
 *       example:
 *         id: 60d5ecb74b24c72b8c8b4567
 *         orderId: 550e8400-e29b-41d4-a716-446655440000
 *         user: 60d5ecb74b24c72b8c8b4568
 *         products:
 *           - product: 60d5ecb74b24c72b8c8b4569
 *             quantity: 2
 *             price: 29.99
 *         totalAmount: 59.98
 *         status: pending
 *         shippingAddress: 60d5ecb74b24c72b8c8b4570
 *         paymentMethod: credit_card
 *         paymentStatus: pending
 *         createdAt: 2023-10-01T10:00:00.000Z
 *         updatedAt: 2023-10-01T10:00:00.000Z
 *
 *     OrderInput:
 *       type: object
 *       required:
 *         - orderId
 *         - products
 *         - shippingAddress
 *         - paymentMethod
 *       properties:
 *         orderId:
 *           type: string
 *           description: Unique order identifier
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - product
 *               - quantity
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product ID
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantity of the product
 *         shippingAddress:
 *           type: string
 *           description: Shipping address ID
 *         paymentMethod:
 *           type: string
 *           description: Payment method
 *       example:
 *         orderId: 550e8400-e29b-41d4-a716-446655440000
 *         products:
 *           - product: 60d5ecb74b24c72b8c8b4569
 *             quantity: 2
 *         shippingAddress: 60d5ecb74b24c72b8c8b4570
 *         paymentMethod: credit_card
 *
 *     OrderResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the order
 *         user:
 *           type: string
 *           description: The user ID who placed the order
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product ID
 *               quantity:
 *                 type: integer
 *                 description: Quantity of the product
 *               price:
 *                 type: number
 *                 description: Price per unit at the time of order
 *         totalAmount:
 *           type: number
 *           description: Total amount of the order
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *           description: Current status of the order
 *         shippingAddress:
 *           type: string
 *           description: Shipping address ID
 *         paymentMethod:
 *           type: string
 *           description: Payment method used
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *           description: Payment status
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the order was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the order was updated
 *       example:
 *         id: 60d5ecb74b24c72b8c8b4567
 *         user: 60d5ecb74b24c72b8c8b4568
 *         products:
 *           - product: 60d5ecb74b24c72b8c8b4569
 *             quantity: 2
 *             price: 29.99
 *         totalAmount: 59.98
 *         status: pending
 *         shippingAddress: 60d5ecb74b24c72b8c8b4570
 *         paymentMethod: credit_card
 *         paymentStatus: pending
 *         createdAt: 2023-10-01T10:00:00.000Z
 *         updatedAt: 2023-10-01T10:00:00.000Z
 *
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders/add:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderInput'
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/OrderResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Product or address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/add', protect, addOrder);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders for current user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user orders
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
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', protect, getUserOrders);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid order ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Not authorized to access this order
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', protect, getOrder);

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *                 description: New status for the order
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Bad request or invalid status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;