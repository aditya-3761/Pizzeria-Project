// routes/admin.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/stats',          protect, adminOnly, ctrl.getDashboardStats);
router.get('/users',          protect, adminOnly, ctrl.getAllUsers);
router.patch('/users/:id/toggle', protect, adminOnly, ctrl.toggleUser);

module.exports = router;
