const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Product name cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  
  price: {
    type: Number,
    required: [true, 'Please add a price'],
    min: [0, 'Price cannot be negative']
  },
  size: {
    type: String,
    required: [true, 'Please add a product size']
  },
  image: {
    type: String,
    required: [true, 'Please add an image']
  },
  images: {
    type: [String],
    required: [true, 'Please add at least one image'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one image is required'
    },
    default: []
  },
  category: {
    type: String,
    required: [true, 'Please add a product category']
  },
  isExplore: {
    type: Boolean,
    default: false
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  offerStrip: {
    type: String,
    trim: true,
    maxlength: [200, 'Offer strip cannot be more than 200 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);