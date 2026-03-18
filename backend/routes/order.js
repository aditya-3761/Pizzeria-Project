const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/auth');

// Customer routes
router.post('/',          protect, ctrl.createOrder);
router.get ('/my',        protect, ctrl.getMyOrders);
router.get ('/my/:id',    protect, ctrl.getOrder);
router.put ('/my/:id/cancel', protect, ctrl.cancelOrder);

// Admin routes
router.get ('/',           protect, adminOnly, ctrl.getAllOrders);
router.put ('/:id/status', protect, adminOnly, ctrl.updateOrderStatus);

module.exports = router;
