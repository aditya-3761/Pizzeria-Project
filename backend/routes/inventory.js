// ── routes/inventory.js ──
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/inventoryController');
const { protect, adminOnly } = require('../middleware/auth');

router.get ('/',                         protect, adminOnly, ctrl.getInventory);
router.get ('/low-stock',                protect, adminOnly, ctrl.getLowStock);
router.put ('/:pizzaId',                 protect, adminOnly, ctrl.updateStock);
router.post('/:pizzaId/restock',         protect, adminOnly, ctrl.restock);

module.exports = router;
