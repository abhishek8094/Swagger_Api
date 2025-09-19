const Order = require('../models/Order');
const Product = require('../models/Product');
const Address = require('../models/Address');
const logger = require('../utils/logger');
const crypto = require('crypto');

// @desc    Add a new order
// @route   POST /api/orders/add
// @access  Private
exports.addOrder = async (req, res, next) => {
  try {
    const { products, shippingAddress, paymentMethod } = req.body;

    logger.info(`Add order request by user ${req.user._id}`);

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      const error = new Error('Please provide products array');
      error.statusCode = 400;
      logger.warn('Products array missing or empty');
      return next(error);
    }

    if (!shippingAddress) {
      const error = new Error('Please provide shipping address');
      error.statusCode = 400;
      logger.warn('Shipping address missing');
      return next(error);
    }

    if (!paymentMethod) {
      const error = new Error('Please provide payment method');
      error.statusCode = 400;
      logger.warn('Payment method missing');
      return next(error);
    }

    // Ensure paymentMethod is a string
    const trimmedPaymentMethod = String(paymentMethod).trim();

    // Validate shipping address exists
    const address = await Address.findById(shippingAddress);

    if (!address) {
      const error = new Error('Shipping address not found');
      error.statusCode = 404;
      logger.warn(`Shipping address not found: ${shippingAddress}`);
      return next(error);
    }

    // Validate products and calculate total
    let totalAmount = 0;
    const validatedProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        const error = new Error(`Product with id ${item.product} not found`);
        error.statusCode = 404;
        logger.warn(`Product not found: ${item.product}`);
        return next(error);
      }

      if (item.quantity < 1) {
        const error = new Error('Product quantity must be at least 1');
        error.statusCode = 400;
        logger.warn(`Invalid quantity for product ${item.product}: ${item.quantity}`);
        return next(error);
      }

      validatedProducts.push({
        product: item.product,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    // Generate unique orderId
    const orderId = crypto.randomUUID();

    // Create order
    const order = await Order.create({
      orderId,
      user: req.user._id,
      products: validatedProducts,
      totalAmount,
      shippingAddress,
      paymentMethod: trimmedPaymentMethod
    });

    // Populate the order with product and address details
    await order.populate([
      { path: 'products.product', select: 'name price image' },
      { path: 'shippingAddress', select: 'countryRegion firstName lastName address apartmentSuite city state pinCode phone' },
      { path: 'user', select: 'firstName lastName email' }
    ]);

    logger.info(`Order created successfully: ${order._id}`);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    logger.error('Error creating order', error);

    if (error.code === 11000) {
      const err = new Error('Duplicate order creation');
      err.statusCode = 400;
      return next(err);
    }

    error.statusCode = 400;
    next(error);
  }
};

// @desc    Get order by orderId
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id })
      .populate([
        { path: 'products.product', select: 'name price image description' },
        { path: 'shippingAddress', select: 'countryRegion firstName lastName address apartmentSuite city state pinCode phone' },
        { path: 'user', select: 'firstName lastName email' }
      ]);

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      return next(error);
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      const error = new Error('Not authorized to access this order');
      error.statusCode = 403;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    const err = new Error('Invalid order ID');
    err.statusCode = 400;
    return next(err);
  }
};

// @desc    Get all orders for current user
// @route   GET /api/orders
// @access  Private
exports.getUserOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate([
        { path: 'products.product', select: 'name price image' },
        { path: 'shippingAddress', select: 'countryRegion firstName lastName address apartmentSuite city state pinCode phone' }
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    error.statusCode = 400;
    next(error);
  }
};

// @desc    Update order status (Admin only)
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      const error = new Error('Please provide status');
      error.statusCode = 400;
      return next(error);
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      const error = new Error('Invalid status');
      error.statusCode = 400;
      return next(error);
    }

    const order = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      { status },
      {
        new: true,
        runValidators: true
      }
    ).populate([
      { path: 'products.product', select: 'name price image' },
      { path: 'shippingAddress', select: 'countryRegion firstName lastName address apartmentSuite city state pinCode phone' },
      { path: 'user', select: 'firstName lastName email' }
    ]);

    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error.name === 'CastError') {
      const err = new Error('Invalid order ID');
      err.statusCode = 400;
      return next(err);
    }

    error.statusCode = 400;
    next(error);
  }
};