const mongoose = require('mongoose');

// ── INVENTORY MODEL ──
const inventorySchema = new mongoose.Schema({
  pizza:     { type: mongoose.Schema.Types.ObjectId, ref: 'Pizza', required: true, unique: true },
  pizzaName: { type: String, required: true },
  quantity:  { type: Number, required: true, min: 0, default: 50 },
  maxStock:  { type: Number, default: 100 },
  lowStockThreshold: { type: Number, default: 10 },
  // Activity log
  activityLog: [{
    type:    { type: String, enum: ['add', 'deduct', 'adjust'] },
    qty:     Number,
    before:  Number,
    after:   Number,
    orderId: String,
    note:    String,
    time:    { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

inventorySchema.virtual('stockPercent').get(function () {
  return Math.round((this.quantity / this.maxStock) * 100);
});
inventorySchema.virtual('isLow').get(function () {
  return this.quantity <= this.lowStockThreshold;
});

const Inventory = mongoose.model('Inventory', inventorySchema);

// ── PAYMENT MODEL ──
const paymentSchema = new mongoose.Schema({
  order:             { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderId:           { type: String, required: true },
  user:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount:            { type: Number, required: true },
  currency:          { type: String, default: 'INR' },
  method:            { type: String, enum: ['razorpay', 'card', 'upi', 'cod'] },
  status:            { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  razorpayOrderId:   String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  paidAt:            Date,
  failureReason:     String
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = { Inventory, Payment };
