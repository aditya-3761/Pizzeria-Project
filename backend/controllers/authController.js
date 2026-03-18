const crypto       = require('crypto');
const { validationResult } = require('express-validator');
const User         = require('../models/User');
const { generateToken } = require('../middleware/auth');
const sendEmail    = require('../utils/sendEmail');

// Helper: send token response
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    msg: message,
    token,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      phone: user.phone
    }
  });
};

// ── REGISTER ──
// POST /api/auth/register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0].msg });
  }

  const { name, email, password } = req.body;

  try {
    // Check duplicate
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ msg: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email: email.toLowerCase(), password });
    sendTokenResponse(user, 201, res, 'Account created successfully! Welcome to Pizzeria 🍕');
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};

// ── LOGIN ──
// POST /api/auth/login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ msg: 'Invalid email or password.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ msg: 'Your account has been deactivated. Contact support.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid email or password.' });
    }

    sendTokenResponse(user, 200, res, `Welcome back, ${user.name}! 🍕`);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error. Please try again.' });
  }
};

// ── GET CURRENT USER ──
// GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};

// ── FORGOT PASSWORD ──
// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: 'Please provide an email address.' });

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ msg: 'User not valid. No account found with this email.' });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;

    const message = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#1a0800;color:#fff8f0;border-radius:16px;padding:32px;">
        <h2 style="color:#FF6B2B;">🍕 Pizzeria — Reset Your Password</h2>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#FF4500,#FF6B2B);color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin:20px 0;">Reset Password</a>
        <p style="color:rgba(255,200,150,0.5);font-size:13px;">This link expires in <strong>15 minutes</strong>. If you didn't request this, ignore this email.</p>
        <p style="color:rgba(255,200,150,0.3);font-size:12px;">Or copy this link: ${resetUrl}</p>
      </div>
    `;

    try {
      await sendEmail({ to: user.email, subject: 'Pizzeria — Password Reset Request', html: message });
      res.json({ msg: 'Password reset link sent to your email!' });
    } catch (emailErr) {
      user.resetPasswordToken  = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ msg: 'Email could not be sent. Please try again.' });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
};

// ── RESET PASSWORD ──
// PUT /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ msg: 'Password must be at least 6 characters.' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid or expired reset token. Please request a new one.' });
    }

    user.password            = password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password reset successfully! You are now logged in.');
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ msg: 'Server error.' });
  }
};

// ── ADMIN LOGIN ──
// POST /api/auth/admin-login
exports.adminLogin = async (req, res) => {
  const { password } = req.body;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ msg: 'Invalid admin password.' });
  }
  try {
    // Find or auto-create admin user
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'Admin',
        email: 'admin@pizzeria.com',
        password: process.env.ADMIN_PASSWORD,
        role: 'admin'
      });
    }
    sendTokenResponse(admin, 200, res, 'Admin login successful.');
  } catch (err) {
    res.status(500).json({ msg: 'Server error.' });
  }
};
