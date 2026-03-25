const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const rateLimit  = require('express-rate-limit');
const connectDB  = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ── CORS ──
// ── CORS ──
app.use(cors({
  origin: function(origin, callback) {
    // Allow all origins in production
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// ── BODY PARSER ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── RATE LIMITER (global) ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  message: { msg: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);

// ── AUTH rate limiter (stricter) ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { msg: 'Too many auth attempts, please wait 15 minutes.' }
});

// ── ROUTES ──
app.use('/api/auth',      authLimiter, require('./routes/auth'));
app.use('/api/pizzas',    require('./routes/pizza'));
app.use('/api/orders',    require('./routes/order'));
app.use('/api/payments',  require('./routes/payment'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/user',      require('./routes/user'));

// ── HEALTH CHECK ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Pizzeria API is running 🍕', time: new Date() });
});

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ msg: `Route ${req.originalUrl} not found` });
});

// ── GLOBAL ERROR HANDLER ──
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    msg: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🍕 Pizzeria Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  MongoDB: Connected`);
});