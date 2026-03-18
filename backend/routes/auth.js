// routes/auth.js
const express    = require('express');
const { body }   = require('express-validator');
const router     = express.Router();
const auth       = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];
const loginRules = [
  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register',       registerRules,  auth.register);
router.post('/login',          loginRules,     auth.login);
router.post('/admin-login',                    auth.adminLogin);
router.get ('/me',             protect,        auth.getMe);
router.post('/forgot-password',                auth.forgotPassword);
router.put ('/reset-password/:token',          auth.resetPassword);

module.exports = router;
