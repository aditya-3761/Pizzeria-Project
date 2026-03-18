const crypto   = require('crypto');
const Razorpay = require('razorpay');
const Order    = require('../models/Order');
const { Payment } = require('../models/InventoryPayment');

// Init Razorpay (only if keys are provided)
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_ID !== 'rzp_test_YourKeyIdHere') {
  razorpay = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
}

// ── CREATE RAZORPAY ORDER ──
// POST /api/payments/razorpay/create-order
exports.createRazorpayOrder = async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ msg: 'Razorpay not configured. Use COD or add your Razorpay keys to .env' });
  }
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: 'Order not found.' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized.' });
    }

    const options = {
      amount:   Math.round(order.total * 100), // paise
      currency: 'INR',
      receipt:  order.orderId,
      notes:    { orderId: order.orderId, userId: req.user._id.toString() }
    };

    const rzpOrder = await razorpay.orders.create(options);

    // Store razorpay order id
    order.razorpayOrderId = rzpOrder.id;
    await order.save();

    // Create payment record
    await Payment.create({
      order:           order._id,
      orderId:         order.orderId,
      user:            req.user._id,
      amount:          order.total,
      method:          'razorpay',
      razorpayOrderId: rzpOrder.id
    });

    res.json({
      razorpayOrderId: rzpOrder.id,
      amount:          rzpOrder.amount,
      currency:        rzpOrder.currency,
      keyId:           process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ msg: 'Could not create payment order. Please try again.' });
  }
};

// ── VERIFY RAZORPAY PAYMENT ──
// POST /api/payments/razorpay/verify
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const body      = razorpay_order_id + '|' + razorpay_payment_id;
    const expected  = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ msg: 'Payment verification failed. Invalid signature.' });
    }

    // Update order
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: 'Order not found.' });

    order.razorpayOrderId   = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    order.paymentStatus     = 'paid';
    await order.save();

    // Update payment record
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: 'paid', paidAt: new Date() }
    );

    res.json({ msg: 'Payment verified successfully! 🎉', order });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ msg: 'Server error verifying payment.' });
  }
};

// ── CONFIRM COD PAYMENT ──
// POST /api/payments/cod/confirm
exports.confirmCOD = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ msg: 'Order not found.' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Not authorized.' });
    }

    order.paymentMethod = 'cod';
    order.paymentStatus = 'pending'; // paid on delivery
    await order.save();

    await Payment.create({
      order:   order._id,
      orderId: order.orderId,
      user:    req.user._id,
      amount:  order.total,
      method:  'cod',
      status:  'pending'
    });

    res.json({ msg: 'COD order confirmed! Pay when your pizza arrives. 🍕', order });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};

// ── GET MY PAYMENTS ──
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .populate('order', 'orderId total status createdAt')
      .sort({ createdAt: -1 });
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};

// ── [ADMIN] GET ALL PAYMENTS ──
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('order', 'orderId total status items')
      .sort({ createdAt: -1 });

    const totalRevenue = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    res.json({ count: payments.length, totalRevenue, payments });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};
