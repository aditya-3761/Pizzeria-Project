const Order   = require('../models/Order');
const User    = require('../models/User');
const Pizza   = require('../models/Pizza');
const { Inventory, Payment } = require('../models/InventoryPayment');

// ── ADMIN DASHBOARD STATS ──
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalOrders,
      totalUsers,
      totalPizzas,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      revenueData,
      recentOrders,
      lowStock
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Pizza.countDocuments(),
      Order.countDocuments({ status: { $in: ['processing', 'kitchen', 'delivery'] } }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
      ]),
      Order.find()
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5),
      Inventory.find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } })
        .populate('pizza', 'name')
    ]);

    const totalRevenue = revenueData[0]?.total || 0;
    const avgOrderValue = revenueData[0]?.count > 0 ? totalRevenue / revenueData[0].count : 0;

    res.json({
      stats: {
        totalOrders, totalUsers, totalPizzas,
        pendingOrders, deliveredOrders, cancelledOrders,
        totalRevenue:  +totalRevenue.toFixed(2),
        avgOrderValue: +avgOrderValue.toFixed(2),
        lowStockCount: lowStock.length
      },
      recentOrders,
      lowStockAlerts: lowStock
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ msg: 'Server error fetching dashboard stats.' });
  }
};

// ── GET ALL USERS (admin) ──
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ createdAt: -1 });
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};

// ── DEACTIVATE USER (admin) ──
exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    if (user.role === 'admin') return res.status(403).json({ msg: 'Cannot deactivate admin.' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ msg: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`, user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};
