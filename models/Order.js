const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Order must belong to a user']
  },
  products: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be positive']
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount must be positive']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    type: mongoose.Schema.ObjectId,
    ref: 'Address',
    required: [true, 'Order must have a shipping address']
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash_on_delivery']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Note: totalAmount is calculated in the controller to ensure accuracy

module.exports = mongoose.model('Order', orderSchema);