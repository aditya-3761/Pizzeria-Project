// ── routes/pizza.js ──
const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/pizzaController');
const { protect, adminOnly } = require('../middleware/auth');

router.get ('/',                        ctrl.getPizzas);
router.get ('/:id',                     ctrl.getPizza);
router.post('/',     protect, adminOnly, ctrl.addPizza);
router.put ('/:id',  protect, adminOnly, ctrl.updatePizza);
router.delete('/:id',protect, adminOnly, ctrl.deletePizza);
router.patch('/:id/toggle', protect, adminOnly, ctrl.toggleAvailability);

module.exports = router;
