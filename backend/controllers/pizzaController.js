const Pizza     = require('../models/Pizza');
const { Inventory } = require('../models/InventoryPayment');

// ── GET ALL PIZZAS (public) ──
exports.getPizzas = async (req, res) => {
  try {
    const { category, available, search, sort } = req.query;
    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (available === 'true') filter.available = true;
    if (search) filter.$text = { $search: search };

    let sortObj = { createdAt: -1 };
    if (sort === 'price-asc')  sortObj = { price: 1 };
    if (sort === 'price-desc') sortObj = { price: -1 };
    if (sort === 'name')       sortObj = { name: 1 };

    const pizzas = await Pizza.find(filter).sort(sortObj);
    res.json({ count: pizzas.length, pizzas });
  } catch (err) {
    res.status(500).json({ msg: 'Server error fetching pizzas.' });
  }
};

// ── GET SINGLE PIZZA ──
exports.getPizza = async (req, res) => {
  try {
    const pizza = await Pizza.findById(req.params.id);
    if (!pizza) return res.status(404).json({ msg: 'Pizza not found.' });
    res.json({ pizza });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};

// ── ADD PIZZA (admin) ──
exports.addPizza = async (req, res) => {
  try {
    const { name, description, price, category, image, available, stock, customizationOptions, tags } = req.body;

    const existing = await Pizza.findOne({ name });
    if (existing) return res.status(400).json({ msg: 'A pizza with this name already exists.' });

    const pizza = await Pizza.create({ name, description, price, category, image, available, customizationOptions, tags });

    // Create inventory entry
    await Inventory.create({
      pizza:     pizza._id,
      pizzaName: pizza.name,
      quantity:  stock || 50,
      maxStock:  Math.max(100, stock || 50),
      activityLog: [{
        type: 'add', qty: stock || 50, before: 0, after: stock || 50,
        note: 'Initial stock when pizza was added'
      }]
    });

    res.status(201).json({ msg: `${pizza.name} added to the menu! 🍕`, pizza });
  } catch (err) {
    console.error('Add pizza error:', err);
    res.status(500).json({ msg: err.message || 'Server error.' });
  }
};

// ── UPDATE PIZZA (admin) ──
exports.updatePizza = async (req, res) => {
  try {
    const { stock, ...updateData } = req.body;
    const pizza = await Pizza.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!pizza) return res.status(404).json({ msg: 'Pizza not found.' });

    // Update inventory stock if provided
    if (stock !== undefined) {
      const inv = await Inventory.findOne({ pizza: pizza._id });
      if (inv) {
        const before = inv.quantity;
        inv.activityLog.unshift({
          type: stock > before ? 'add' : 'adjust',
          qty: Math.abs(stock - before), before, after: stock,
          note: 'Stock updated via admin panel'
        });
        inv.quantity = stock;
        await inv.save();
      }
    }

    res.json({ msg: `${pizza.name} updated successfully.`, pizza });
  } catch (err) {
    res.status(500).json({ msg: err.message || 'Server error.' });
  }
};

// ── DELETE PIZZA (admin) ──
exports.deletePizza = async (req, res) => {
  try {
    const pizza = await Pizza.findByIdAndDelete(req.params.id);
    if (!pizza) return res.status(404).json({ msg: 'Pizza not found.' });
    await Inventory.findOneAndDelete({ pizza: req.params.id });
    res.json({ msg: `${pizza.name} removed from the menu.` });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};

// ── TOGGLE AVAILABILITY (admin) ──
exports.toggleAvailability = async (req, res) => {
  try {
    const pizza = await Pizza.findById(req.params.id);
    if (!pizza) return res.status(404).json({ msg: 'Pizza not found.' });
    pizza.available = !pizza.available;
    await pizza.save();
    res.json({ msg: `${pizza.name} is now ${pizza.available ? 'available ✅' : 'unavailable ❌'}`, pizza });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};
