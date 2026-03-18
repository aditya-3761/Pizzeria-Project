const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  pizza:          { type: mongoose.Schema.Types.ObjectId, ref: 'Pizza' },
  pizzaName:      { type: String, required: true },  // snapshot at time of order
  pizzaImage:     { type: String },
  basePrice:      { type: Number, required: true },
  quantity:       { type: Number, required: true, min: 1 },
  size:           { type: String, default: 'Medium' },
  customizations: [String],
  itemTotal:      { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items:    [orderItemSchema],
  // Pricing
  subtotal:      { type: Number, required: true },
  discount:      { type: Number, default: 0 },
  promoCode:     { type: String },
  tax:           { type: Number, required: true },
  deliveryFee:   { type: Number, default: 2 },
  deliveryType:  { type: String, enum: ['standard', 'express', 'pickup'], default: 'standard' },
  total:         { type: Number, required: true },
  // Delivery
  deliveryAddress: {
    name:    String,
    address: String,
    city:    String,
    pincode: String,
    phone:   String
  },
  // Payment
  paymentMethod:  { type: String, enum: ['razorpay', 'card', 'upi', 'cod'], required: true },
  paymentStatus:  { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  razorpayOrderId:   String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  // Order lifecycle
  status: {
    type: String,
    enum: ['processing', 'kitchen', 'delivery', 'delivered', 'cancelled'],
    default: 'processing'
  },
  statusHistory: [{
    status:    String,
    updatedAt: { type: Date, default: Date.now },
    note:      String
  }],
  estimatedDelivery: Date,
  deliveredAt:       Date,
  cancelReason:      String
}, {
  timestamps: true
});

// Auto-generate orderId before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const count  = await mongoose.model('Order').countDocuments();
    this.orderId = `ORD-${String(count + 1001).padStart(5, '0')}`;
  }
  // Push to statusHistory whenever status changes
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status });
    if (this.status === 'delivered') this.deliveredAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
