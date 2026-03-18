const { Inventory } = require('../models/InventoryPayment');

// ── GET ALL INVENTORY ──
exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find().populate('pizza', 'name image price category');
    res.json({ inventory });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};

// ── UPDATE STOCK (admin) ──
exports.updateStock = async (req, res) => {
  try {
    const { quantity, note } = req.body;
    const inv = await Inventory.findOne({ pizza: req.params.pizzaId });
    if (!inv) return res.status(404).json({ msg: 'Inventory record not found.' });

    const before = inv.quantity;
    const type   = quantity > before ? 'add' : 'deduct';
    inv.activityLog.unshift({
      type, qty: Math.abs(quantity - before), before, after: quantity,
      note: note || 'Manual stock update'
    });
    inv.quantity = quantity;
    await inv.save();

    res.json({ msg: `Stock updated for ${inv.pizzaName}`, inventory: inv });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};

// ── RESTOCK (add qty) ──
exports.restock = async (req, res) => {
  try {
    const { addQty, note } = req.body;
    if (!addQty || addQty < 1) return res.status(400).json({ msg: 'Please provide a valid quantity.' });

    const inv = await Inventory.findOne({ pizza: req.params.pizzaId });
    if (!inv) return res.status(404).json({ msg: 'Inventory record not found.' });

    const before = inv.quantity;
    inv.quantity += addQty;
    inv.activityLog.unshift({
      type: 'add', qty: addQty, before, after: inv.quantity,
      note: note || `Restocked +${addQty} units`
    });
    await inv.save();

    res.json({ msg: `${inv.pizzaName} restocked by +${addQty} units`, inventory: inv });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};

// ── GET LOW STOCK ALERTS ──
exports.getLowStock = async (req, res) => {
  try {
    const inventory = await Inventory.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } })
      .populate('pizza', 'name image');
    res.json({ count: inventory.length, inventory });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};
