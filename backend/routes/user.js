// routes/user.js
const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// GET profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (err) { res.status(500).json({ msg: 'Server error.' }); }
});

// UPDATE profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, addresses } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, addresses },
      { new: true, runValidators: true }
    );
    res.json({ msg: 'Profile updated successfully.', user });
  } catch (err) { res.status(500).json({ msg: 'Server error.' }); }
});

// CHANGE password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ msg: 'New password must be at least 6 characters.' });

    const user = await User.findById(req.user._id).select('+password');
    const match = await user.matchPassword(currentPassword);
    if (!match) return res.status(401).json({ msg: 'Current password is incorrect.' });

    user.password = newPassword;
    await user.save();
    res.json({ msg: 'Password changed successfully.' });
  } catch (err) { res.status(500).json({ msg: 'Server error.' }); }
});

module.exports = router;
