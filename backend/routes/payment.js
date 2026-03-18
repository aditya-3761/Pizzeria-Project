// ── routes/payment.js ──
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/paymentController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/razorpay/create-order', protect, ctrl.createRazorpayOrder);
router.post('/razorpay/verify',       protect, ctrl.verifyRazorpayPayment);
router.post('/cod/confirm',           protect, ctrl.confirmCOD);
router.get ('/my',                    protect, ctrl.getMyPayments);
router.get ('/',                      protect, adminOnly, ctrl.getAllPayments);

module.exports = router;
