const mongoose = require('mongoose');

const pizzaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pizza name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    enum: ['veg', 'nonveg', 'cheesy', 'spicy', 'popular'],
    default: 'veg'
  },
  image: {
    type: String,
    default: 'pizza1.jpg'
  },
  available: {
    type: Boolean,
    default: true
  },
  // Customization options with their extra prices
  customizationOptions: {
    sizes: [{
      name:  { type: String },
      extra: { type: Number, default: 0 }
    }],
    toppings: [{
      name:  { type: String },
      extra: { type: Number, default: 0 }
    }]
  },
  ratings: {
    average: { type: Number, default: 4.5, min: 0, max: 5 },
    count:   { type: Number, default: 0 }
  },
  tags: [String]
}, {
  timestamps: true
});

// Index for search
pizzaSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Pizza', pizzaSchema);
