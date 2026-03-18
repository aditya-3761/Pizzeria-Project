const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── Protect: user must be logged in ──
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ msg: 'Not authorized. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ msg: 'User not found. Please log in again.' });
    if (!req.user.isActive) return res.status(401).json({ msg: 'Account has been deactivated.' });
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid or expired token. Please log in again.' });
  }
};

// ── Admin only ──
exports.adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ msg: 'Admin access required.' });
};

// ── Generate JWT ──
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};
