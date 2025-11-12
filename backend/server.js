const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const mongoURI = process.env.MONGO_URI;

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected successfully.');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Define User Schema
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    passwordResetToken: String,
    passwordResetExpires: Date
});

const User = mongoose.model('User', userSchema);

// Inventory Schema
const inventorySchema = new mongoose.Schema({
    pizzaName: {
        type: String,
        required: true,
        unique: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 15
    }
});

const Inventory = mongoose.model('Inventory', inventorySchema);

// Orders Schema
const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    items: {
        type: Array,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Order Received', 'In the Kitchen', 'Sent for Delivery', 'Delivered'],
        default: 'Order Received'
    }
});

const Order = mongoose.model('Order', orderSchema);

// Payment Schema
const paymentSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Payment = mongoose.model('Payment', paymentSchema);


// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Admin Route to get inventory
app.get('/api/inventory', async (req, res) => {
    try {
        const inventory = await Inventory.find({});
        res.status(200).json(inventory);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Admin Route to get orders
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find({});
        res.status(200).json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Admin Route to get payments
app.get('/api/payments', async (req, res) => {
    try {
        const payments = await Payment.find({});
        console.log(payments);
        res.status(200).json(payments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Admin Route to update order status
app.put('/api/orders/:orderId/status', async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    try {
        const order = await Order.findOneAndUpdate(
            { orderId },
            { status },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        res.status(200).json(order);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Modified placeOrder route to handle inventory deduction and order saving
app.post('/api/place-order', async (req, res) => {
    const { cart, paymentMethod } = req.body;

    try {
        const orderId = `PIZZA-${Date.now()}`;
        const total = cart.reduce((sum, item) => sum + item.total, 0);

        // Deduct from inventory
        for (const item of cart) {
            const pizza = await Inventory.findOne({ pizzaName: item.name });
            if (!pizza || pizza.quantity < item.quantity) {
                return res.status(400).json({ msg: `Not enough stock for ${item.name}` });
            }
            pizza.quantity -= item.quantity;
            await pizza.save();
        }

        const newOrder = new Order({
            orderId,
            items: cart,
            total,
            date: new Date().toLocaleString(),
            paymentMethod,
            status: 'Order Received'
        });
        console.log(newOrder);  
        await newOrder.save();
        
        // Save a new payment record (NEW)
        const newPayment = new Payment({
            orderId,
            total,
            paymentMethod
        });
        console.log(newPayment);
        await newPayment.save();
        
        res.status(200).json({ msg: 'Order placed successfully', orderId });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Registration route
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    // Sanitize and validate input
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    try {
        let user = await User.findOne({ email: sanitizedEmail });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ name: name.trim(), email: sanitizedEmail, password: sanitizedPassword });

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(sanitizedPassword, salt);

        await user.save();
        res.status(201).json({ msg: 'User registered successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    // Sanitize and validate input
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedPassword = password.trim();

    try {
        let user = await User.findOne({ email: sanitizedEmail });
        if (!user) {
            return res.status(400).json({ msg: 'User not defined, please register as a new user' });
        }

        const isMatch = await bcrypt.compare(sanitizedPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        res.status(200).json({ msg: 'Successfully logged in' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Forgot password route
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(400).json({ msg: 'User not valid. Please register as a new user' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `http://localhost:5000/reset-password.html?token=${resetToken}`;
        const mailOptions = {
            to: user.email,
            from: process.env.EMAIL_USER,
            subject: 'Pizzeria Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n`
                  + `Please click on the following link, or paste this into your browser to complete the process:\n\n`
                  + `${resetUrl}\n\n`
                  + `If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ msg: 'Password reset email sent. Please check your inbox.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Reset password route
app.post('/api/reset-password/:token', async (req, res) => {
    const { password } = req.body;

    try {
        const user = await User.findOne({
            passwordResetToken: req.params.token,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ msg: 'Password reset token is invalid or has expired.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();
        res.status(200).json({ msg: 'Password has been successfully updated.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});