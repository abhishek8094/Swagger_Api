const mongoose = require('mongoose');

const carouselSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: [true, 'Please add an image URL']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Carousel', carouselSchema);
