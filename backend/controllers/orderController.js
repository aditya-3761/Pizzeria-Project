const Order      = require('../models/Order');
const Pizza      = require('../models/Pizza');
const User       = require('../models/User');
const { Inventory, Payment } = require('../models/InventoryPayment');
const sendEmail  = require('../utils/sendEmail');

const PROMO_CODES   = { 'PIZZA20': 0.20, 'SAVE10': 0.10, 'NEWUSER': 0.15 };
const DELIVERY_FEES = { standard: 2.00, express: 5.00, pickup: 0 };

// ── Send order confirmation email ──────────────────────────────────────────
const sendOrderConfirmationEmail = async (order, user) => {
  try {
    const itemsRows = (order.items || []).map(item => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,150,50,0.1);color:#FFF8F0;font-size:14px;">${item.pizzaName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,150,50,0.1);color:rgba(255,200,150,0.7);font-size:14px;text-align:center;">x${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,150,50,0.1);color:#FFB347;font-size:14px;text-align:right;font-weight:700;">$${item.itemTotal.toFixed(2)}</td>
      </tr>`).join('');

    const deliveryMethodLabel = { standard:'Standard Delivery (~25 min)', express:'Express Delivery (~15 min)', pickup:'Self Pickup' }[order.deliveryType] || 'Standard Delivery';
    const paymentMethodLabel  = { razorpay:'Razorpay (Online)', card:'Credit/Debit Card', upi:'UPI', cod:'Cash on Delivery' }[order.paymentMethod] || order.paymentMethod;

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0d0300;font-family:'Segoe UI',Arial,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:24px 16px;">

  <div style="text-align:center;padding:32px 24px 24px;background:linear-gradient(135deg,#1a0800,#2a1005);border-radius:20px 20px 0 0;border:1px solid rgba(255,160,80,0.2);border-bottom:none;">
    <div style="width:64px;height:64px;background:linear-gradient(135deg,#FF4500,#FF6B2B);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:32px;line-height:64px;">🍕</div>
    <h1 style="margin:0;font-size:26px;color:#FFFDF9;font-weight:900;">Order Confirmed!</h1>
    <p style="margin:8px 0 0;color:rgba(255,200,150,0.6);font-size:14px;">Your pizza is being prepared with love</p>
  </div>

  <div style="background:rgba(255,100,30,0.12);border-left:4px solid #FF6B2B;border-right:1px solid rgba(255,160,80,0.2);padding:14px 20px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,180,100,0.5);margin-bottom:3px;">Order Number</div>
      <div style="font-size:18px;font-weight:800;color:#FF6B2B;font-family:'Courier New',monospace;">#${order.orderId}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,180,100,0.5);margin-bottom:3px;">Placed On</div>
      <div style="font-size:13px;color:rgba(255,200,150,0.7);">${new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
      <div style="font-size:12px;color:rgba(255,200,150,0.4);">${new Date(order.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
    </div>
  </div>

  <div style="background:linear-gradient(180deg,#1e0a02,#180600);border:1px solid rgba(255,160,80,0.2);border-top:none;border-radius:0 0 20px 20px;padding:24px;">

    <p style="margin:0 0 20px;font-size:15px;color:rgba(255,200,150,0.75);line-height:1.6;">
      Hi <strong style="color:#FFFDF9;">${user.name}</strong>, thank you for your order! Our chefs are already getting to work. 🔥
    </p>

    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,180,100,0.5);margin-bottom:10px;">Your Order</div>
      <table style="width:100%;border-collapse:collapse;background:rgba(255,255,255,0.03);border-radius:12px;overflow:hidden;">
        <thead><tr style="background:rgba(255,100,30,0.1);">
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,180,100,0.5);">Item</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,180,100,0.5);">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,180,100,0.5);">Price</th>
        </tr></thead>
        <tbody>${itemsRows}</tbody>
      </table>
    </div>

    <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:16px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:13px;color:rgba(255,200,150,0.5);">Subtotal</span><span style="font-size:13px;color:rgba(255,200,150,0.7);">$${order.subtotal.toFixed(2)}</span></div>
      ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:13px;color:rgba(255,200,150,0.5);">Discount (${order.promoCode})</span><span style="font-size:13px;color:#6ee07a;">-$${order.discount.toFixed(2)}</span></div>` : ''}
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="font-size:13px;color:rgba(255,200,150,0.5);">Tax (8%)</span><span style="font-size:13px;color:rgba(255,200,150,0.7);">$${order.tax.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="font-size:13px;color:rgba(255,200,150,0.5);">Delivery</span><span style="font-size:13px;color:rgba(255,200,150,0.7);">${order.deliveryFee===0?'Free':'$'+order.deliveryFee.toFixed(2)}</span></div>
      <div style="display:flex;justify-content:space-between;border-top:1px solid rgba(255,150,50,0.15);padding-top:12px;">
        <span style="font-size:15px;font-weight:700;color:#FFFDF9;">Total Paid</span>
        <span style="font-size:18px;font-weight:900;color:#FFB347;">$${order.total.toFixed(2)}</span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
      <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:14px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,180,100,0.5);margin-bottom:6px;">Delivery Address</div>
        <div style="font-size:13px;color:#FFFDF9;font-weight:600;">${order.deliveryAddress?.name || user.name}</div>
        <div style="font-size:12px;color:rgba(255,200,150,0.55);margin-top:3px;line-height:1.5;">${order.deliveryAddress?.address || ''}, ${order.deliveryAddress?.city || ''} ${order.deliveryAddress?.pincode ? '— '+order.deliveryAddress.pincode : ''}</div>
        ${order.deliveryAddress?.phone ? `<div style="font-size:12px;color:rgba(255,200,150,0.4);margin-top:3px;">${order.deliveryAddress.phone}</div>` : ''}
      </div>
      <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:14px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,180,100,0.5);margin-bottom:6px;">Payment</div>
        <div style="font-size:13px;color:#FFFDF9;font-weight:600;">${paymentMethodLabel}</div>
        <div style="font-size:11px;color:rgba(255,200,150,0.5);margin-top:3px;">${deliveryMethodLabel}</div>
      </div>
    </div>

    <div style="background:linear-gradient(135deg,rgba(255,80,0,0.15),rgba(255,150,50,0.08));border:1px solid rgba(255,100,30,0.3);border-radius:12px;padding:14px 16px;margin-bottom:20px;text-align:center;">
      <div style="font-size:12px;color:rgba(255,200,150,0.5);margin-bottom:4px;">Estimated Delivery</div>
      <div style="font-size:20px;font-weight:900;color:#FFB347;">25 – 35 minutes</div>
    </div>

    <div style="text-align:center;margin-bottom:20px;">
      <a href="http://127.0.0.1:5500/tracking.html" style="display:inline-block;background:linear-gradient(135deg,#FF4500,#FF6B2B);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:700;">Track Your Order →</a>
    </div>

    <p style="margin:0;font-size:12px;color:rgba(255,200,150,0.3);text-align:center;line-height:1.7;">
      Thank you for choosing <strong style="color:rgba(255,200,150,0.5);">Pizzeria</strong> 🍕
    </p>
  </div>
</div>
</body></html>`;

    await sendEmail({ to: user.email, subject: `Order Confirmed! #${order.orderId} — Pizzeria`, html });
    console.log(`📧 Confirmation email sent to ${user.email} for #${order.orderId}`);
  } catch (err) {
    console.error('⚠️  Confirmation email failed (order still placed):', err.message);
  }
};

// ── Helper: deduct inventory ──────────────────────────────────────────────
const deductInventory = async (items, orderId) => {
  for (const item of items) {
    const inv = await Inventory.findOne({ pizzaName: { $regex: new RegExp(`^${item.pizzaName}$`, 'i') } });
    if (inv) {
      const before = inv.quantity;
      inv.quantity = Math.max(0, inv.quantity - item.quantity);
      inv.activityLog.unshift({ type:'deduct', qty:item.quantity, before, after:inv.quantity, orderId, note:`Order ${orderId} entered kitchen` });
      await inv.save();
    }
  }
};

// ── CREATE ORDER ──────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, paymentMethod, deliveryType, promoCode } = req.body;
    if (!items || !items.length) return res.status(400).json({ msg: 'Order must have at least one item.' });

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const pizza     = await Pizza.findById(item.pizzaId).catch(() => null);
      const basePrice = pizza ? pizza.price : item.basePrice;
      const unitPrice = basePrice + (item.sizeExtra || 0) + (item.toppingExtra || 0);
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;
      orderItems.push({ pizza:pizza?._id, pizzaName:pizza?.name||item.pizzaName, pizzaImage:pizza?.image||item.pizzaImage, basePrice:unitPrice, quantity:item.quantity, size:item.size||'Medium', customizations:item.customizations||[], itemTotal });
    }

    let discount = 0;
    if (promoCode && PROMO_CODES[promoCode.toUpperCase()]) {
      discount = +(subtotal * PROMO_CODES[promoCode.toUpperCase()]).toFixed(2);
    }
    const discounted = subtotal - discount;
    const tax        = +(discounted * 0.08).toFixed(2);
    const delivery   = DELIVERY_FEES[deliveryType] ?? 2;
    const total      = +(discounted + tax + delivery).toFixed(2);

    const order = await Order.create({
      user: req.user._id, items: orderItems,
      subtotal: +subtotal.toFixed(2), discount,
      promoCode: promoCode?.toUpperCase(), tax,
      deliveryFee: delivery, deliveryType: deliveryType||'standard', total,
      deliveryAddress, paymentMethod: paymentMethod||'cod', paymentStatus:'pending',
      statusHistory: [{ status:'processing', note:'Order placed successfully' }],
      estimatedDelivery: new Date(Date.now() + 35 * 60 * 1000)
    });

    // Send confirmation email
    const user = await User.findById(req.user._id);
    if (user?.email) await sendOrderConfirmationEmail(order, user);

    res.status(201).json({ msg: `Order placed! Confirmation sent to ${user?.email} 🍕`, order });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ msg: err.message || 'Server error placing order.' });
  }
};

// ── GET MY ORDERS ─────────────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const { status, sort='newest', page=1, limit=10 } = req.query;
    const filter = { user: req.user._id };
    if (status && status !== 'all') filter.status = status;
    const sortObj = sort==='oldest'?{createdAt:1}:sort==='highest'?{total:-1}:sort==='lowest'?{total:1}:{createdAt:-1};
    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter).sort(sortObj).skip((page-1)*limit).limit(+limit);
    res.json({ count:total, page:+page, pages:Math.ceil(total/limit), orders });
  } catch (err) { res.status(500).json({ msg:'Server error.' }); }
};

// ── GET SINGLE ORDER ──────────────────────────────────────────────────────
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id:req.params.id, user:req.user._id });
    if (!order) return res.status(404).json({ msg:'Order not found.' });
    res.json({ order });
  } catch (err) { res.status(500).json({ msg:'Server error.' }); }
};

// ── CANCEL ORDER ──────────────────────────────────────────────────────────
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id:req.params.id, user:req.user._id });
    if (!order) return res.status(404).json({ msg:'Order not found.' });
    if (['delivered','cancelled'].includes(order.status)) return res.status(400).json({ msg:`Cannot cancel a ${order.status} order.` });
    if (order.status==='delivery') return res.status(400).json({ msg:'Order is out for delivery.' });
    order.status       = 'cancelled';
    order.cancelReason = req.body.reason || 'Cancelled by customer';
    await order.save();
    res.json({ msg:'Order cancelled successfully.', order });
  } catch (err) { res.status(500).json({ msg:'Server error.' }); }
};

// ── [ADMIN] GET ALL ORDERS ────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const { status, sort='newest', page=1, limit=20, search } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (search) filter.$or = [{ orderId:{ $regex:search, $options:'i' } }];
    const sortObj = sort==='oldest'?{createdAt:1}:{createdAt:-1};
    const total  = await Order.countDocuments(filter);
    const orders = await Order.find(filter).populate('user','name email phone').sort(sortObj).skip((page-1)*limit).limit(+limit);
    res.json({ count:total, page:+page, pages:Math.ceil(total/limit), orders });
  } catch (err) { res.status(500).json({ msg:'Server error.' }); }
};

// ── [ADMIN] UPDATE ORDER STATUS ───────────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    if (!['processing','kitchen','delivery','delivered','cancelled'].includes(status))
      return res.status(400).json({ msg:'Invalid status.' });

    const order = await Order.findById(req.params.id).populate('user','name email');
    if (!order) return res.status(404).json({ msg:'Order not found.' });

    const prev    = order.status;
    order.status  = status;
    if (note) order.statusHistory[order.statusHistory.length - 1].note = note;

    if (status === 'kitchen' && prev !== 'kitchen') await deductInventory(order.items, order.orderId);
    if (status === 'delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
      await Payment.findOneAndUpdate({ order:order._id }, { status:'paid', paidAt:new Date() });
    }
    await order.save();

    // Status update email to customer
    if (order.user?.email && ['kitchen','delivery','delivered'].includes(status)) {
      const msgs = {
        kitchen:   { subj:`Your pizza is in the oven! 🔥 #${order.orderId}`, body:'Our chefs have started preparing your order.' },
        delivery:  { subj:`Your order is on its way! 🛵 #${order.orderId}`, body:'Your pizza has been picked up and is heading to you.' },
        delivered: { subj:`Order delivered! 🎉 #${order.orderId}`, body:'Your pizza has arrived. Enjoy every bite!' }
      };
      const m = msgs[status];
      sendEmail({
        to: order.user.email, subject: m.subj,
        html:`<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#1a0800;color:#FFF8F0;border-radius:16px;padding:32px;text-align:center;"><h2 style="color:#FF6B2B;">${m.subj}</h2><p style="color:rgba(255,200,150,0.7);">${m.body}</p><div style="background:rgba(255,100,30,0.12);border-radius:10px;padding:12px 20px;display:inline-block;margin:16px 0;"><span style="font-family:'Courier New';font-size:18px;font-weight:800;color:#FF6B2B;">#${order.orderId}</span></div><br><a href="http://127.0.0.1:5500/tracking.html" style="display:inline-block;background:linear-gradient(135deg,#FF4500,#FF6B2B);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;">Track Order</a></div>`
      }).catch(e => console.error('Status email error:', e.message));
    }

    res.json({ msg:`Order #${order.orderId} updated to "${status}"`, order });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ msg:'Server error.' });
  }
};
