const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a category title'],
    trim: true,
    maxlength: [50, 'Category title cannot be more than 50 characters'],
    unique: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Please add an image URL']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', categorySchema);
