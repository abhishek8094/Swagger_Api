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
    enum: ['S', 'M', 'L', 'XL'],
    required: [true, 'Please add a product size']
  },
  imageUrl: {
    type: String,
    required: [true, 'Please add an image URL']
  },
  subImg: {
    type: String
  },
  category: {
    type: String,
    required: [true, 'Please add a product category'],
    enum: ['Compression Fit', 'T-Shirts', 'Joggers', 'Shorts', 'Stringers'],
    trim: true
  },
  isExplore: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);