/**
 * PIZZERIA — Frontend API Bridge v3
 * Auth guards on all protected pages | Address form | Email confirmation
 */

const API = 'https://YOUR-RAILWAY-URL.up.railway.app/api';

// ── AUTH ──────────────────────────────────────────────────────────────────
const Auth = {
  getToken  : ()           => localStorage.getItem('pz_token'),
  getUser   : ()           => JSON.parse(localStorage.getItem('pz_user') || 'null'),
  isLoggedIn: ()           => !!localStorage.getItem('pz_token'),
  isAdmin   : ()           => Auth.getUser()?.role === 'admin',
  save      : (token, user) => { localStorage.setItem('pz_token', token); localStorage.setItem('pz_user', JSON.stringify(user)); },
  clear     : ()           => { localStorage.removeItem('pz_token'); localStorage.removeItem('pz_user'); }
};

// ── AUTH GUARD — blocks protected pages if not logged in ──────────────────
function requireAuth(redirectAfter) {
  if (Auth.isLoggedIn()) return true;
  if (redirectAfter) localStorage.setItem('pz_redirect_after_login', redirectAfter);
  const overlay = document.createElement('div');
  overlay.id = 'pz-auth-guard';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.93);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;';
  overlay.innerHTML = `
    <div style="background:linear-gradient(160deg,#1e0a02,#2a1005);border:1px solid rgba(255,150,50,.22);border-radius:28px;padding:3rem 2.5rem;text-align:center;max-width:420px;width:90vw;position:relative;animation:pzFU .5s cubic-bezier(.16,1,.3,1) both;">
      <style>@keyframes pzFU{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}</style>
      <div style="position:absolute;top:0;left:20%;right:20%;height:2px;background:linear-gradient(90deg,transparent,#FF4500,transparent);border-radius:2px;"></div>
      <div style="width:72px;height:72px;border-radius:50%;background:rgba(255,80,0,.15);border:2px solid rgba(255,100,30,.35);display:flex;align-items:center;justify-content:center;margin:0 auto 1.2rem;box-shadow:0 0 30px rgba(255,80,0,.15);">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B2B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      <h2 style="font-family:'Playfair Display',serif;font-size:1.7rem;font-weight:900;color:#FFFDF9;margin-bottom:.5rem;">Login Required</h2>
      <p style="font-size:.88rem;color:rgba(255,200,150,.55);line-height:1.7;margin-bottom:1.8rem;">You need to be logged in to access this page.<br>Please log in or create a free account to continue.</p>
      <div style="display:flex;gap:.8rem;">
        <a href="login.html" style="flex:1;padding:.9rem;border-radius:12px;background:linear-gradient(135deg,#FF4500,#FF6B2B);color:#fff;text-decoration:none;font-weight:700;font-size:.92rem;text-align:center;box-shadow:0 8px 24px rgba(255,80,0,.35);display:block;">Log In</a>
        <a href="registration.html" style="flex:1;padding:.9rem;border-radius:12px;background:transparent;border:1px solid rgba(255,150,50,.3);color:rgba(255,200,150,.75);text-decoration:none;font-weight:600;font-size:.92rem;text-align:center;display:block;">Register</a>
      </div>
      <a href="home.html" style="display:block;margin-top:1rem;font-size:.8rem;color:rgba(255,200,150,.3);text-decoration:none;">Back to Home</a>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  return false;
}

// ── Redirect back after login ─────────────────────────────────────────────
function handlePostLoginRedirect() {
  const redirect = localStorage.getItem('pz_redirect_after_login');
  if (redirect) { localStorage.removeItem('pz_redirect_after_login'); window.location.href = redirect; }
}

// ── Auto-guard protected pages ────────────────────────────────────────────
(function autoGuard() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  const PROTECTED = ['cart.html', 'order.html', 'payment.html', 'tracking.html'];
  if (PROTECTED.includes(page)) requireAuth(page);
  if (page === 'admin.html' && Auth.isLoggedIn() && !Auth.isAdmin()) requireAuth();
})();


// ── HTTP ──────────────────────────────────────────────────────────────────
async function api(endpoint, options = {}) {
  const token   = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(`${API}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || `Request failed (${res.status})`);
  return data;
}

// ── TOAST ─────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:.5rem;align-items:center;pointer-events:none;';
    document.body.appendChild(c);
  }
  if (!document.getElementById('_pz_toast_css')) {
    const s = document.createElement('style'); s.id = '_pz_toast_css';
    s.textContent = '@keyframes pzTIn{from{transform:translateY(20px) scale(.9);opacity:0}to{transform:translateY(0) scale(1);opacity:1}}@keyframes pzTOut{from{opacity:1}to{transform:translateY(20px) scale(.9);opacity:0}}';
    document.head.appendChild(s);
  }
  const borderColor = type === 'success' ? 'rgba(80,220,100,.4)' : type === 'error' ? 'rgba(255,80,80,.4)' : 'rgba(255,180,50,.35)';
  const t = document.createElement('div');
  t.style.cssText = `background:rgba(25,8,0,.97);border:1px solid ${borderColor};border-radius:12px;padding:.8rem 1.4rem;font-size:.88rem;color:#fff8f0;display:flex;align-items:center;gap:.6rem;box-shadow:0 10px 40px rgba(0,0,0,.5);font-family:'DM Sans',sans-serif;white-space:nowrap;animation:pzTIn .4s both;pointer-events:all;`;
  const icon = type === 'success'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6ee07a" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg>`
    : type === 'error'
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff8080" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffc060" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  t.innerHTML = icon + ' ' + msg;
  c.appendChild(t);
  setTimeout(() => { t.style.animation = 'pzTOut .35s forwards'; setTimeout(() => t.remove(), 350); }, 3200);
}

// ── CART ──────────────────────────────────────────────────────────────────
function getCart()   { return JSON.parse(localStorage.getItem('pz_cart') || '[]'); }
function saveCart(c) { localStorage.setItem('pz_cart', JSON.stringify(c)); updateCartCount(); }
function addToCart(item) {
  const cart = getCart();
  const ex   = cart.find(c => c.id === item.id && JSON.stringify(c.customizations) === JSON.stringify(item.customizations));
  if (ex) ex.qty += item.qty; else cart.push(item);
  saveCart(cart);
  showToast(`${item.name} added to cart!`, 'success');
}
function updateCartCount() {
  const total = getCart().reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll('#cart-count, .cart-count').forEach(b => b.textContent = total);
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE: LOGIN
// ════════════════════════════════════════════════════════════════════════════
function initLoginPage() {
  if (!document.getElementById('login-form')) return;
  if (Auth.isLoggedIn()) { window.location.href = Auth.isAdmin() ? 'admin.html' : 'dashboard.html'; return; }

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn   = document.getElementById('login-btn');
    const email = document.getElementById('email').value.trim();
    const pass  = document.getElementById('password').value;
    if (btn) btn.classList.add('loading');
    try {
      const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password: pass }) });
      Auth.save(data.token, data.user);
      showToast(data.msg, 'success');
      setTimeout(() => { const r=localStorage.getItem('pz_redirect_after_login'); if(r){localStorage.removeItem('pz_redirect_after_login');window.location.href=r;return;} window.location.href=data.user.role==='admin'?'admin.html':'dashboard.html'; }, 1000);
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) btn.classList.remove('loading');
    }
  });

  const adminForm = document.getElementById('admin-login-form');
  if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('admin-password').value;
      const btn      = document.getElementById('admin-submit-btn');
      if (btn) btn.classList.add('loading');
      try {
        const data = await api('/auth/admin-login', { method: 'POST', body: JSON.stringify({ password }) });
        Auth.save(data.token, data.user);
        showToast('Admin login successful!', 'success');
        setTimeout(() => window.location.href = 'admin.html', 800);
      } catch (err) {
        showToast(err.message, 'error');
        if (btn) btn.classList.remove('loading');
        const ap = document.getElementById('admin-password');
        if (ap) ap.value = '';
      }
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE: REGISTER
// ════════════════════════════════════════════════════════════════════════════
function initRegisterPage() {
  if (!document.getElementById('registration-form')) return;
  if (Auth.isLoggedIn()) { window.location.href = 'dashboard.html'; return; }

  document.getElementById('registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name    = document.getElementById('name').value.trim();
    const email   = document.getElementById('email').value.trim();
    const pass    = document.getElementById('password').value;
    const confirm = document.getElementById('confirm-password').value;
    const terms   = document.getElementById('terms');
    const btn     = document.getElementById('register-btn');

    if (pass !== confirm) { showToast('Passwords do not match!', 'error'); return; }
    if (terms && !terms.checked) { showToast('Please accept the Terms of Service.', 'error'); return; }
    if (btn) btn.classList.add('loading');
    try {
      const data = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password: pass }) });
      Auth.save(data.token, data.user);
      showToast(data.msg, 'success');
      setTimeout(() => { const r=localStorage.getItem('pz_redirect_after_login'); if(r){localStorage.removeItem('pz_redirect_after_login');window.location.href=r;return;} window.location.href='dashboard.html'; }, 1200);
    } catch (err) {
      showToast(err.message, 'error');
      if (btn) btn.classList.remove('loading');
    }
  });
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE: FORGOT PASSWORD
// ════════════════════════════════════════════════════════════════════════════
function initForgotPage() {
  if (!document.getElementById('forgot-password-form')) return;

  document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const btn   = document.getElementById('send-btn');
    if (btn) btn.classList.add('loading');
    try {
      const data = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      const el = document.getElementById('sent-email-display');
      if (el) el.textContent = email;
      if (typeof switchState === 'function') switchState('success');
      if (typeof startCountdown === 'function') startCountdown(60);
      showToast(data.msg, 'success');
    } catch (err) {
      if (err.message.toLowerCase().includes('not valid') || err.message.toLowerCase().includes('not found')) {
        const el = document.getElementById('not-found-email');
        if (el) el.textContent = email;
        if (typeof switchState === 'function') switchState('unregistered');
      } else { showToast(err.message, 'error'); }
    } finally { if (btn) btn.classList.remove('loading'); }
  });

  const resendBtn = document.getElementById('resend-btn');
  if (resendBtn) {
    resendBtn.addEventListener('click', async () => {
      const email = document.getElementById('email').value;
      try { await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); showToast('Reset link resent!', 'success'); }
      catch (err) { showToast('Could not resend. Try again.', 'error'); }
    });
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE: DASHBOARD — Fixed customize modal + SVG icons
// ════════════════════════════════════════════════════════════════════════════
function initDashboardPage() {
  if (!document.getElementById('pizza-grid')) return;

  // ── SVG Icons ──
  const ICONS = {
    cart   : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    check  : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6ee07a" stroke-width="2.5"><polyline points="20,6 9,17 4,12"/></svg>`,
    edit   : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    heart  : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    heartFill:`<svg width="16" height="16" viewBox="0 0 24 24" fill="#ff6b6b" stroke="#ff6b6b" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
    star   : `<svg width="12" height="12" viewBox="0 0 24 24" fill="#FFB347" stroke="#FFB347" stroke-width="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`,
  };

  async function loadPizzas(filter = 'all', sort = 'default', search = '') {
    const grid  = document.getElementById('pizza-grid');
    const empty = document.getElementById('empty-state');
    if (!grid) return;
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:rgba(255,200,150,.4);font-family:'DM Sans',sans-serif;">Loading menu…</div>`;

    try {
      let endpoint = '/pizzas?available=true';
      if (filter !== 'all') endpoint += `&category=${filter}`;
      if (search)           endpoint += `&search=${encodeURIComponent(search)}`;
      if (sort !== 'default') endpoint += `&sort=${sort}`;

      const data   = await api(endpoint);
      const pizzas = data.pizzas || [];
      window._pizzaData = pizzas; // store globally for customize modal

      const countEl = document.getElementById('showing-count');
      if (countEl) countEl.textContent = pizzas.length;

      if (!pizzas.length) { grid.innerHTML = ''; if (empty) empty.classList.add('show'); return; }
      if (empty) empty.classList.remove('show');
      grid.innerHTML = '';

      pizzas.forEach((p, i) => {
        const wl       = new Set(JSON.parse(localStorage.getItem('pz_wishlist') || '[]'));
        const isWished = wl.has(p._id);
        const badgeMap = { veg:'🌿 Veg', nonveg:'Non-Veg', popular:'Popular', cheesy:'Cheesy', spicy:'Spicy' };

        const card = document.createElement('div');
        card.className = 'pizza-card';
        card.dataset.pizzaId    = p._id;
        card.dataset.pizzaName  = p.name;
        card.dataset.pizzaPrice = p.price;
        card.dataset.pizzaImage = p.image;
        card.style.animationDelay = (i * 0.07) + 's';

        card.innerHTML = `
          ${badgeMap[p.category] ? `<div class="card-badge ${p.category === 'veg' ? 'veg' : p.category === 'popular' ? 'popular' : ''}">${badgeMap[p.category]}</div>` : ''}
          <button class="wishlist-btn ${isWished ? 'liked' : ''}" data-id="${p._id}" title="${isWished ? 'Remove from wishlist' : 'Add to wishlist'}">${isWished ? ICONS.heartFill : ICONS.heart}</button>
          <div class="card-img-wrap">
            <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='pizza1.jpg'">
            <div class="card-rating">${ICONS.star} ${p.ratings?.average || 4.5}</div>
          </div>
          <div class="card-body">
            <div class="card-top">
              <div class="card-name">${p.name}</div>
              <div class="card-price">$${p.price.toFixed(2)}</div>
            </div>
            <p class="card-desc">${p.description}</p>
            <div class="card-tags">${(p.tags && p.tags.length ? p.tags : [p.category]).map(t => `<span class="card-tag">${t}</span>`).join('')}</div>
            <div class="card-actions">
              <div class="qty-row">
                <button class="qty-btn minus-btn">−</button>
                <input type="number" class="qty-input" value="1" min="1" max="10">
                <button class="qty-btn plus-btn">+</button>
              </div>
              <div class="btn-row">
                <button class="btn-cart add-cart-btn">${ICONS.cart} Add to Cart</button>
                <button class="btn-customize open-custom-btn">${ICONS.edit} Customize</button>
              </div>
            </div>
          </div>`;

        card.querySelector('.minus-btn').addEventListener('click', () => {
          const inp = card.querySelector('.qty-input');
          if (parseInt(inp.value) > 1) inp.value = parseInt(inp.value) - 1;
        });
        card.querySelector('.plus-btn').addEventListener('click', () => {
          const inp = card.querySelector('.qty-input');
          if (parseInt(inp.value) < 10) inp.value = parseInt(inp.value) + 1;
        });

        card.querySelector('.add-cart-btn').addEventListener('click', function () {
          if (!Auth.isLoggedIn()) { showToast('Please login to add items to cart', 'error'); setTimeout(() => window.location.href = 'login.html', 1500); return; }
          const qty = parseInt(card.querySelector('.qty-input').value);
          addToCart({ id: p._id, name: p.name, price: p.price, image: p.image, customizations: [], qty });
          this.innerHTML = ICONS.check + ' Added!';
          this.classList.add('added');
          setTimeout(() => { this.innerHTML = ICONS.cart + ' Add to Cart'; this.classList.remove('added'); }, 1500);
        });

        // ── FIX: Customize button — pass full pizza data ──
        card.querySelector('.open-custom-btn').addEventListener('click', () => {
          openCustomizeModal(p);
        });

        card.querySelector('.wishlist-btn').addEventListener('click', function () {
          const wl2 = new Set(JSON.parse(localStorage.getItem('pz_wishlist') || '[]'));
          if (wl2.has(p._id)) {
            wl2.delete(p._id); this.innerHTML = ICONS.heart; this.classList.remove('liked');
            showToast('Removed from wishlist', 'info');
          } else {
            wl2.add(p._id); this.innerHTML = ICONS.heartFill; this.classList.add('liked');
            showToast('Added to wishlist', 'success');
          }
          localStorage.setItem('pz_wishlist', JSON.stringify([...wl2]));
        });

        // Make card visible with inline transition (no CSS class dependency)
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        card.style.transition = `opacity 0.5s ${i * 0.07}s ease, transform 0.5s ${i * 0.07}s ease`;
        grid.appendChild(card);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }));
      });
    } catch (err) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#ff8080;font-family:'DM Sans',sans-serif;">Could not load menu. Is the server running?<br><small style="color:rgba(255,200,150,.4);">${err.message}</small></div>`;
    }
  }

  // ── FIX: Full customize modal ──
  function openCustomizeModal(pizza) {
    // Use the existing modal in dashboard.html if present
    const modal   = document.getElementById('customization-modal-overlay') || document.getElementById('custom-modal');
    if (!modal) { showToast('Customize modal not found on this page.', 'error'); return; }
    modal.style.display = 'flex';
    modal.classList.add('active');

    // Fill in hidden fields
    const basePrice = document.getElementById('custom-base-price');
    const baseImage = document.getElementById('custom-base-image');
    const baseName  = document.getElementById('custom-original-pizza-name');
    const titleEl   = document.getElementById('customization-pizza-name') || document.getElementById('modal-pizza-name');
    const imgEl     = document.getElementById('modal-img');

    if (basePrice) basePrice.value = pizza.price;
    if (baseImage) baseImage.value = pizza.image;
    if (baseName)  baseName.value  = pizza.name;
    if (titleEl)   titleEl.textContent = `Customize — ${pizza.name}`;
    if (imgEl)     { imgEl.src = pizza.image; imgEl.onerror = () => imgEl.src = 'pizza1.jpg'; }

    // Base price label
    const basePriceLabel = document.getElementById('modal-base-label');
    if (basePriceLabel) basePriceLabel.textContent = `Base price: $${pizza.price.toFixed(2)}`;

    // Reset all checkboxes/radios
    modal.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    modal.querySelectorAll('input[type="radio"]').forEach((rb, i) => rb.checked = i === 0);
    modal.querySelectorAll('.topping-item').forEach(t => t.classList.remove('selected'));
    modal.querySelectorAll('.size-pill').forEach((s, i) => s.classList.toggle('selected', i === 0));

    // Update live price
    updateCustomTotal(pizza.price);

    // ── Wire size pills ──
    modal.querySelectorAll('.size-pill').forEach(pill => {
      // Remove old listeners by cloning
      const newPill = pill.cloneNode(true);
      pill.parentNode.replaceChild(newPill, pill);
      newPill.style.cursor = 'pointer';
      newPill.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        modal.querySelectorAll('.size-pill').forEach(p => {
          p.classList.remove('selected');
          p.style.borderColor = '';
          p.style.background  = '';
        });
        newPill.classList.add('selected');
        newPill.style.borderColor = 'var(--ember, #FF6B2B)';
        newPill.style.background  = 'rgba(255,100,30,0.14)';
        const radio = newPill.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
        updateCustomTotal(pizza.price);
      });
    });

    // ── Wire topping checkboxes — key fix ──
    modal.querySelectorAll('.topping-item').forEach(item => {
      // Clone to remove ALL old listeners
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
      newItem.style.cursor = 'pointer';

      newItem.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isSelected = newItem.classList.contains('selected');
        newItem.classList.toggle('selected', !isSelected);

        // Visual feedback inline
        if (!isSelected) {
          newItem.style.borderColor = 'var(--ember, #FF6B2B)';
          newItem.style.background  = 'rgba(255,100,30,0.12)';
        } else {
          newItem.style.borderColor = '';
          newItem.style.background  = '';
        }

        // Update checkbox
        const cb = newItem.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = !isSelected;

        // Update check mark indicator
        const checkMark = newItem.querySelector('.t-check');
        if (checkMark) {
          checkMark.style.background   = !isSelected ? 'var(--ember, #FF6B2B)' : '';
          checkMark.style.borderColor  = !isSelected ? 'var(--ember, #FF6B2B)' : '';
          checkMark.style.color        = !isSelected ? '#fff' : 'transparent';
        }

        updateCustomTotal(pizza.price);
      });
    });

    // Add to cart button in modal
    const addBtn = document.getElementById('add-customized-pizza-to-cart') || document.getElementById('modal-add-btn');
    if (addBtn) {
      const newAddBtn = addBtn.cloneNode(true);
      addBtn.parentNode.replaceChild(newAddBtn, addBtn);
      newAddBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Get selected size
        const selectedSizePill = modal.querySelector('.size-pill.selected');
        const size             = selectedSizePill?.dataset.size || selectedSizePill?.querySelector('input')?.value || 'Medium';
        const sizePrice        = parseFloat(selectedSizePill?.dataset.price || 0);

        // Get selected toppings from .selected class
        const toppings    = [];
        let   toppingCost = 0;
        modal.querySelectorAll('.topping-item.selected').forEach(item => {
          const cb = item.querySelector('input[type="checkbox"]');
          if (cb) toppings.push(cb.value);
          toppingCost += parseFloat(item.dataset.price || 0);
        });

        const totalPrice = pizza.price + sizePrice + toppingCost;
        addToCart({
          id:             pizza._id + '_custom_' + Date.now(),
          name:           `${pizza.name} (${size})`,
          price:          parseFloat(totalPrice.toFixed(2)),
          image:          pizza.image,
          customizations: [size, ...toppings],
          qty:            1
        });
        closeCustomizeModal();
      });
    }
  }

  function updateCustomTotal(basePrice) {
    const modal = document.getElementById('customization-modal-overlay') || document.getElementById('custom-modal');
    if (!modal) return;
    let total = basePrice;

    // Size extra
    const selectedSize = modal.querySelector('.size-pill.selected');
    if (selectedSize) total += parseFloat(selectedSize.dataset.price || 0);

    // Topping extras — use .selected class (most reliable after our click handler)
    modal.querySelectorAll('.topping-item.selected').forEach(item => {
      total += parseFloat(item.dataset.price || 0);
    });

    const priceEl = document.getElementById('custom-pizza-current-price') || document.getElementById('modal-total-price');
    if (priceEl) priceEl.textContent = '$' + total.toFixed(2);
  }

  function closeCustomizeModal() {
    const modal = document.getElementById('customization-modal-overlay') || document.getElementById('custom-modal');
    if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
  }

  // Close modal on backdrop click / X button
  document.addEventListener('click', (e) => {
    const modal = document.getElementById('customization-modal-overlay') || document.getElementById('custom-modal');
    if (!modal) return;
    if (e.target === modal) closeCustomizeModal();
    if (e.target.classList.contains('close-modal-btn') || e.target.closest('.close-modal-btn')) closeCustomizeModal();
  });

  // Filters
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', function () {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      loadPizzas(this.dataset.filter, document.getElementById('sort-select')?.value || 'default', document.getElementById('search-input')?.value || '');
    });
  });

  const sortSel = document.getElementById('sort-select');
  if (sortSel) sortSel.addEventListener('change', () => loadPizzas(
    document.querySelector('.filter-chip.active')?.dataset.filter || 'all', sortSel.value, document.getElementById('search-input')?.value || ''
  ));

  const searchInp = document.getElementById('search-input');
  if (searchInp) {
    let timer;
    searchInp.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => loadPizzas(
        document.querySelector('.filter-chip.active')?.dataset.filter || 'all',
        sortSel?.value || 'default', searchInp.value
      ), 400);
      const clr = document.getElementById('search-clear');
      if (clr) clr.style.display = searchInp.value ? 'block' : 'none';
    });
  }
  const clearBtn = document.getElementById('search-clear');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    if (searchInp) searchInp.value = '';
    clearBtn.style.display = 'none';
    loadPizzas();
  });

  loadPizzas();
  updateCartCount();
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE: CART — Full rendering + redirect to payment
// ════════════════════════════════════════════════════════════════════════════
function initCartPage() {
  // Detect cart page by any of these containers
  const isCartPage = document.getElementById('cart-items-list') ||
                     document.getElementById('cart-items') ||
                     document.getElementById('checkout-btn');
  if (!isCartPage) return;

  // ── Render cart for ORIGINAL cart.html (ul#cart-items) ──
  const legacyList = document.getElementById('cart-items');
  const legacyTotal = document.getElementById('cart-total');
  const legacyBtns  = document.getElementById('cart-page-buttons');

  if (legacyList) {
    function renderLegacyCart() {
      const cart = getCart();
      legacyList.innerHTML = '';

      if (!cart.length) {
        legacyList.innerHTML = `
          <li style="list-style:none;text-align:center;padding:3rem;color:rgba(255,200,150,.4);">
            <div style="font-size:3rem;margin-bottom:.8rem;opacity:.3;">🛒</div>
            <div style="font-size:1rem;margin-bottom:.8rem;">Your cart is empty</div>
            <a href="dashboard.html" style="color:#FF6B2B;font-size:.9rem;">Browse Menu →</a>
          </li>`;
        if (legacyTotal) legacyTotal.textContent = 'Total: $0.00';
        if (legacyBtns)  legacyBtns.innerHTML = '';
        return;
      }

      cart.forEach((item, idx) => {
        const li = document.createElement('li');
        li.style.cssText = 'list-style:none;display:flex;align-items:center;gap:1rem;padding:.9rem;background:rgba(255,255,255,.04);border-radius:14px;border:1px solid rgba(255,150,50,.12);margin-bottom:.7rem;';
        li.innerHTML = `
          <img src="${item.image}" alt="${item.name}" style="width:54px;height:54px;border-radius:10px;object-fit:cover;border:1.5px solid rgba(255,150,50,.18);flex-shrink:0;" onerror="this.src='pizza1.jpg'">
          <div style="flex:1;min-width:0;">
            <div style="font-size:.92rem;font-weight:600;color:#FFFDF9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</div>
            ${item.customizations?.length ? `<div style="font-size:.72rem;color:rgba(255,200,150,.4);margin-top:.1rem;">${item.customizations.join(', ')}</div>` : ''}
            <div style="font-size:.78rem;color:rgba(255,200,150,.4);margin-top:.15rem;">$${item.price.toFixed(2)} each</div>
          </div>
          <div style="display:flex;align-items:center;gap:.5rem;">
            <button onclick="changeQty(${idx},-1)" style="width:28px;height:28px;border-radius:8px;background:rgba(255,100,30,.12);border:1px solid rgba(255,100,30,.22);color:#FFB347;font-size:1rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
            <span style="font-size:.9rem;font-weight:700;color:#FFFDF9;min-width:22px;text-align:center;">${item.qty}</span>
            <button onclick="changeQty(${idx},+1)" style="width:28px;height:28px;border-radius:8px;background:rgba(255,100,30,.12);border:1px solid rgba(255,100,30,.22);color:#FFB347;font-size:1rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
          </div>
          <div style="font-family:'Playfair Display',serif;font-size:1rem;font-weight:900;color:#FFB347;min-width:60px;text-align:right;">$${(item.price * item.qty).toFixed(2)}</div>
          <button onclick="removeFromCart(${idx})" style="background:none;border:none;color:rgba(255,120,120,.4);font-size:1.1rem;cursor:pointer;padding:.2rem;transition:color .2s;" onmouseover="this.style.color='#ff8080'" onmouseout="this.style.color='rgba(255,120,120,.4)'">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6m5,0V4a1,1,0,0,1,1-1h2a1,1,0,0,1,1,1v2"/></svg>
          </button>`;
        legacyList.appendChild(li);
      });

      const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const tax      = subtotal * 0.08;
      const delivery = 2.00;
      const total    = subtotal + tax + delivery;

      if (legacyTotal) {
        legacyTotal.innerHTML = `
          <div style="background:rgba(30,10,2,.7);border:1px solid rgba(255,160,80,.18);border-radius:18px;padding:1.4rem 1.6rem;margin-top:1rem;">
            <div style="display:flex;justify-content:space-between;font-size:.85rem;color:rgba(255,200,150,.5);padding:.3rem 0;"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:.85rem;color:rgba(255,200,150,.5);padding:.3rem 0;"><span>Tax (8%)</span><span>$${tax.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:.85rem;color:rgba(255,200,150,.5);padding:.3rem 0;"><span>Delivery</span><span>$${delivery.toFixed(2)}</span></div>
            <div style="display:flex;justify-content:space-between;font-size:1rem;font-weight:700;color:#FFFDF9;border-top:1px solid rgba(255,150,50,.12);margin-top:.5rem;padding-top:.7rem;"><span>Total</span><span style="font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:900;color:#FFB347;">$${total.toFixed(2)}</span></div>
          </div>`;
      }

      if (legacyBtns) {
        legacyBtns.innerHTML = `
          <div style="display:flex;gap:.8rem;margin-top:1rem;flex-wrap:wrap;">
            <button id="checkout-btn" style="flex:1;min-width:160px;padding:.9rem 1.5rem;border-radius:12px;background:linear-gradient(135deg,#FF4500,#FF6B2B);border:none;color:#fff;font-family:'DM Sans',sans-serif;font-size:.95rem;font-weight:700;cursor:pointer;transition:all .3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
              Proceed to Payment →
            </button>
            <button onclick="clearCartConfirm()" style="padding:.9rem 1.3rem;border-radius:12px;background:transparent;border:1px solid rgba(255,80,80,.25);color:rgba(255,120,120,.6);font-family:'DM Sans',sans-serif;font-size:.88rem;cursor:pointer;transition:all .3s;" onmouseover="this.style.color='#ff8080'" onmouseout="this.style.color='rgba(255,120,120,.6)'">
              Clear Cart
            </button>
            <a href="dashboard.html" style="padding:.9rem 1.3rem;border-radius:12px;background:transparent;border:1px solid rgba(255,150,50,.2);color:rgba(255,200,150,.55);font-family:'DM Sans',sans-serif;font-size:.88rem;text-decoration:none;display:flex;align-items:center;transition:all .3s;" onmouseover="this.style.color='#FFB347'" onmouseout="this.style.color='rgba(255,200,150,.55)'">
              ← Add More
            </a>
          </div>`;

        // Wire checkout button
        document.getElementById('checkout-btn').addEventListener('click', handleCheckout);
      }
    }

    window.changeQty = (idx, delta) => {
      const cart = getCart();
      cart[idx].qty += delta;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
      saveCart(cart);
      renderLegacyCart();
    };
    window.removeFromCart = (idx) => {
      const cart = getCart(); cart.splice(idx, 1); saveCart(cart); renderLegacyCart();
      showToast('Item removed.', 'info');
    };
    window.clearCartConfirm = () => {
      if (confirm('Remove all items from cart?')) { saveCart([]); renderLegacyCart(); showToast('Cart cleared.', 'info'); }
    };

    renderLegacyCart();
  }

  const checkoutBtn = document.getElementById('checkout-btn');
  if (!checkoutBtn) return;

  // Wire checkout button for enhanced cart.html
  checkoutBtn.addEventListener('click', handleCheckout);
}

// Shared checkout handler used by both original and enhanced cart.html
function handleCheckout() {
    if (!Auth.isLoggedIn()) {
      showToast('Please log in to place an order.', 'error');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }

    const cart = getCart();
    if (!cart.length) { showToast('Your cart is empty!', 'error'); return; }

    // ── FIX: Save cart data and redirect to payment — don't create order here ──
    const deliveryType = document.querySelector('.delivery-opt.selected input')?.value || 'standard';
    const promoCode    = document.getElementById('promo-input')?.value?.trim() || '';

    // Calculate totals for payment page display
    const PROMO_CODES   = { 'PIZZA20': 0.20, 'SAVE10': 0.10, 'NEWUSER': 0.15 };
    const DELIVERY_FEES = { standard: 2.00, express: 5.00, pickup: 0 };
    const subtotal  = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const discount  = PROMO_CODES[promoCode?.toUpperCase()] ? subtotal * PROMO_CODES[promoCode.toUpperCase()] : 0;
    const tax       = (subtotal - discount) * 0.08;
    const delivery  = DELIVERY_FEES[deliveryType] ?? 2;
    const total     = subtotal - discount + tax + delivery;

    // Save checkout data for payment page
    localStorage.setItem('pz_checkout_data', JSON.stringify({
      cart, deliveryType, promoCode, subtotal, discount, tax, delivery, total
    }));

    showToast('Redirecting to payment…', 'info');
    setTimeout(() => window.location.href = 'payment.html', 800);
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE: PAYMENT — Fixed: creates order THEN processes payment, redirects to tracking
// ════════════════════════════════════════════════════════════════════════════
function initPaymentPage() {
  if (!document.getElementById('pay-btn')) return;

  if (!Auth.isLoggedIn()) {
    showToast('Please log in first.', 'error');
    setTimeout(() => window.location.href = 'login.html', 1200);
    return;
  }

  // ── Load order summary from checkout data ──
  const checkoutData = JSON.parse(localStorage.getItem('pz_checkout_data') || '{}');
  const cart = checkoutData.cart || getCart();

  if (cart.length > 0) {
    // Populate summary items
    const siEl = document.getElementById('summary-items');
    if (siEl) {
      siEl.innerHTML = cart.map(item => `
        <div class="summary-item">
          <img src="${item.image}" alt="${item.name}" class="s-img" onerror="this.src='pizza1.jpg'">
          <div class="s-name">${item.name} <span class="s-qty">×${item.qty}</span></div>
          <div class="s-price">$${(item.price * item.qty).toFixed(2)}</div>
        </div>`).join('');
    }
    // Populate totals
    const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
    setEl('p-subtotal', '$' + (checkoutData.subtotal || 0).toFixed(2));
    setEl('p-tax',      '$' + (checkoutData.tax || 0).toFixed(2));
    setEl('p-delivery', checkoutData.delivery === 0 ? 'Free' : '$' + (checkoutData.delivery || 2).toFixed(2));
    setEl('p-total',    '$' + (checkoutData.total || 0).toFixed(2));

    if (checkoutData.discount > 0) {
      setEl('p-discount', '-$' + checkoutData.discount.toFixed(2));
      const dr = document.getElementById('p-discount-row');
      if (dr) dr.style.display = 'flex';
    }

    const payBtnText = document.getElementById('pay-btn-text');
    if (payBtnText) payBtnText.textContent = `Pay $${(checkoutData.total || 0).toFixed(2)}`;
  }

  // ── Payment button handler ──
  document.getElementById('pay-btn').addEventListener('click', async function () {
    const method = document.querySelector('.method-opt.selected input')?.value || 'cod';

    if (!cart.length) { showToast('No items in cart.', 'error'); return; }
    this.classList.add('loading');

    try {
      // Step 1: Create the order
      const user             = Auth.getUser();
      const deliveryAddress  = {
        name:    user?.name || 'Customer',
        address: document.querySelector('.addr-opt.selected .addr-text')?.textContent || 'Home Address',
        city:    'Delhi', pincode: '110001',
        phone:   user?.phone || ''
      };

      const items = cart.map(item => ({
        pizzaId: item.id, pizzaName: item.name, pizzaImage: item.image,
        basePrice: item.price, quantity: item.qty,
        customizations: item.customizations || [],
        sizeExtra: 0, toppingExtra: 0
      }));

      const orderData = await api('/orders', {
        method: 'POST',
        body: JSON.stringify({
          items, deliveryAddress,
          paymentMethod: method,
          deliveryType:  checkoutData.deliveryType || 'standard',
          promoCode:     checkoutData.promoCode || ''
        })
      });

      const order = orderData.order;

      // Step 2: Process payment
      if (method === 'razorpay') {
        // Create Razorpay order
        try {
          const rzpData = await api('/payments/razorpay/create-order', {
            method: 'POST', body: JSON.stringify({ orderId: order._id })
          });
          const options = {
            key: rzpData.keyId, amount: rzpData.amount, currency: rzpData.currency,
            name: 'Pizzeria', description: `Order #${order.orderId}`,
            order_id: rzpData.razorpayOrderId,
            handler: async (response) => {
              try {
                await api('/payments/razorpay/verify', {
                  method: 'POST',
                  body: JSON.stringify({
                    razorpay_order_id:   response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature:  response.razorpay_signature,
                    orderId: order._id
                  })
                });
                goToTracking(order);
              } catch (e) { showToast('Payment verification failed: ' + e.message, 'error'); }
            },
            prefill: { name: user?.name, email: user?.email },
            theme: { color: '#FF6B2B' }
          };
          if (typeof Razorpay !== 'undefined') {
            const rzp = new Razorpay(options);
            rzp.open();
            rzp.on('payment.failed', () => showToast('Payment failed. Try COD instead.', 'error'));
          } else {
            // Razorpay script not loaded — fall back to COD
            await api('/payments/cod/confirm', { method: 'POST', body: JSON.stringify({ orderId: order._id }) });
            goToTracking(order);
          }
          this.classList.remove('loading');
        } catch (e) {
          showToast('Razorpay not configured. Processing as COD.', 'info');
          await api('/payments/cod/confirm', { method: 'POST', body: JSON.stringify({ orderId: order._id }) });
          goToTracking(order);
        }
      } else {
        // COD / Card / UPI
        await api('/payments/cod/confirm', { method: 'POST', body: JSON.stringify({ orderId: order._id }) });
        goToTracking(order);
      }

    } catch (err) {
      showToast(err.message, 'error');
      this.classList.remove('loading');
    }
  });

  function goToTracking(order) {
    // Save order for tracking page
    localStorage.setItem('pz_tracking_order', JSON.stringify(order));
    // Clear cart and checkout data
    saveCart([]);
    localStorage.removeItem('pz_checkout_data');
    localStorage.removeItem('pz_pending_order_id');
    localStorage.removeItem('pz_pending_order');

    showToast('Order confirmed! Redirecting to tracking…', 'success');
    setTimeout(() => window.location.href = 'tracking.html', 1200);
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE: ORDER HISTORY
// ════════════════════════════════════════════════════════════════════════════
function initOrderPage() {
  const list = document.getElementById('orders-list') || document.getElementById('order-history-list');
  if (!list || document.getElementById('sec-orders')) return;

  if (!Auth.isLoggedIn()) {
    list.innerHTML = '<p style="color:rgba(255,200,150,.5);text-align:center;padding:2rem;">Please <a href="login.html" style="color:#FF6B2B;">log in</a> to view your orders.</p>';
    return;
  }

  const TRACK_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>`;

  async function loadMyOrders(status = 'all', sort = 'newest') {
    list.innerHTML = '<div style="text-align:center;padding:2rem;color:rgba(255,200,150,.4);">Loading orders…</div>';
    try {
      const data   = await api(`/orders/my?status=${status}&sort=${sort}`);
      const orders = data.orders || [];
      updateOrderStats(orders, data.count);
      if (!orders.length) {
        list.innerHTML = `<div style="text-align:center;padding:3rem;"><div style="font-size:3rem;opacity:.3;margin-bottom:.8rem;">📦</div><p style="color:rgba(255,200,150,.4);">No orders yet. <a href="dashboard.html" style="color:#FF6B2B;">Browse menu</a></p></div>`;
        return;
      }
      renderOrders(orders);
    } catch (err) {
      list.innerHTML = `<p style="color:#ff8080;text-align:center;padding:2rem;">${err.message}</p>`;
    }
  }

  function updateOrderStats(orders, total) {
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const spent     = orders.reduce((s, o) => s + o.total, 0);
    const pizzas    = orders.reduce((s, o) => s + (o.items || []).reduce((ss, i) => ss + i.quantity, 0), 0);
    const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
    setEl('stat-total', total || orders.length);
    setEl('stat-spent', '$' + spent.toFixed(0));
    setEl('stat-delivered', delivered);
    setEl('stat-pizzas', pizzas);
  }

  function renderOrders(orders) {
    const STATUS_MAP = {
      processing: { label:'Order Received',   cls:'delivered' },
      kitchen:    { label:'In the Kitchen',   cls:'processing' },
      delivery:   { label:'Out for Delivery', cls:'processing' },
      delivered:  { label:'Delivered',        cls:'delivered' },
      cancelled:  { label:'Cancelled',        cls:'cancelled' }
    };
    list.innerHTML = orders.map(o => {
      const st      = STATUS_MAP[o.status] || { label: o.status, cls: 'processing' };
      const date    = new Date(o.createdAt);
      const dateStr = date.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
      const timeStr = date.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
      const items   = (o.items || []).map(i => `${i.quantity}× ${i.pizzaName}`).join(', ');
      const tlMap   = { processing:[1,0,0,0], kitchen:[1,1,0,0], delivery:[1,1,1,0], delivered:[1,1,1,1], cancelled:[1,0,0,0] };
      const steps   = tlMap[o.status] || [1,0,0,0];
      const stepIcons  = ['📋','🔥','🛵','🏠'];
      const stepLabels = ['Placed','Kitchen','Delivery','Delivered'];

      // Show Track button for active orders
      const canTrack = ['processing','kitchen','delivery'].includes(o.status);

      return `
        <div class="order-card" id="oc-${o._id}">
          <div class="order-header" onclick="this.closest('.order-card').classList.toggle('expanded')">
            <div class="order-id-badge">#${o.orderId}</div>
            <div class="order-meta">
              <div class="order-date">${dateStr} · ${timeStr}</div>
              <div class="order-items-preview">${items}</div>
            </div>
            <div class="order-right">
              <span class="status-badge ${st.cls}"><span class="dot"></span>${st.label}</span>
              <div class="order-total">$${o.total.toFixed(2)}</div>
              <span class="chevron">▼</span>
            </div>
          </div>
          <div class="order-body">
            <div class="order-body-inner">
              <div class="order-timeline">
                ${stepLabels.map((lbl, i) => `
                  <div class="tl-step">
                    <div class="tl-dot ${steps[i] ? (i === steps.lastIndexOf(1) && o.status !== 'delivered' ? 'active' : 'done') : ''}">${stepIcons[i]}</div>
                    <div class="tl-label">${lbl}</div>
                  </div>
                  ${i < 3 ? `<div class="tl-line ${steps[i] && steps[i+1] ? 'done' : ''}"></div>` : ''}
                `).join('')}
              </div>
              <table class="items-table">
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>
                  ${(o.items||[]).map(item => `
                    <tr>
                      <td><img src="${item.pizzaImage||'pizza1.jpg'}" class="item-img" onerror="this.style.display='none'">
                          <span class="item-name">${item.pizzaName}</span>
                          ${(item.customizations||[]).length ? `<div class="item-custom">${item.customizations.join(', ')}</div>` : ''}
                      </td>
                      <td>×${item.quantity}</td>
                      <td>$${item.itemTotal.toFixed(2)}</td>
                    </tr>`).join('')}
                </tbody>
              </table>
              <div class="order-summary">
                <div class="summary-row"><span>Subtotal</span><span>$${o.subtotal.toFixed(2)}</span></div>
                ${o.discount > 0 ? `<div class="summary-row"><span>Discount</span><span style="color:#6ee07a;">-$${o.discount.toFixed(2)}</span></div>` : ''}
                <div class="summary-row"><span>Tax</span><span>$${o.tax.toFixed(2)}</span></div>
                <div class="summary-row"><span>Delivery</span><span>${o.deliveryFee === 0 ? 'Free' : '$'+o.deliveryFee.toFixed(2)}</span></div>
                <div class="summary-row total"><span>Total</span><span>$${o.total.toFixed(2)}</span></div>
              </div>
              <div class="order-actions">
                <button class="btn-reorder" onclick="reorderItems('${o._id}')">Reorder</button>
                ${canTrack ? `<button class="btn-track" onclick="trackOrder('${o._id}')">
                  ${TRACK_ICON} Track Order</button>` : ''}
                ${o.status === 'processing' ? `<button class="btn-track" onclick="cancelOrder('${o._id}')" style="border-color:rgba(255,80,80,.3);color:rgba(255,120,120,.7);">Cancel</button>` : ''}
              </div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  // ── FIX: Track Order — saves order and goes to tracking.html ──
  window.trackOrder = async (orderId) => {
    try {
      const data = await api(`/orders/my/${orderId}`);
      localStorage.setItem('pz_tracking_order', JSON.stringify(data.order));
      window.location.href = 'tracking.html';
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.reorderItems = (orderId) => {
    api(`/orders/my/${orderId}`)
      .then(data => {
        const cart = getCart();
        (data.order.items || []).forEach(item => {
          const ex = cart.find(c => c.name === item.pizzaName);
          if (ex) ex.qty += item.quantity;
          else cart.push({ id: item.pizza || item.pizzaName, name: item.pizzaName, price: item.basePrice, image: item.pizzaImage, customizations: item.customizations || [], qty: item.quantity });
        });
        saveCart(cart);
        showToast('Items added to cart!', 'success');
      })
      .catch(err => showToast(err.message, 'error'));
  };

  window.cancelOrder = (orderId) => {
    if (!confirm('Cancel this order?')) return;
    api(`/orders/my/${orderId}/cancel`, { method: 'PUT', body: JSON.stringify({ reason: 'Cancelled by customer' }) })
      .then(() => { showToast('Order cancelled.', 'info'); loadMyOrders(); })
      .catch(err => showToast(err.message, 'error'));
  };

  document.querySelectorAll('[data-filter]').forEach(chip => {
    chip.addEventListener('click', function () {
      document.querySelectorAll('[data-filter]').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      loadMyOrders(this.dataset.filter, document.getElementById('sort-select')?.value || 'newest');
    });
  });
  const sortSel = document.getElementById('sort-select');
  if (sortSel) sortSel.addEventListener('change', () =>
    loadMyOrders(document.querySelector('[data-filter].active')?.dataset.filter || 'all', sortSel.value));

  const searchInp = document.getElementById('search-input');
  if (searchInp) searchInp.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    document.querySelectorAll('.order-card').forEach(c => { c.style.display = c.textContent.toLowerCase().includes(q) ? '' : 'none'; });
  });

  loadMyOrders();
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE: ADMIN
// ════════════════════════════════════════════════════════════════════════════
function initAdminPage() {
  if (!document.getElementById('sec-overview')) return;
  if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
    document.body.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:'DM Sans',sans-serif;flex-direction:column;gap:1rem;background:#0e0500;color:#ff8080;"><div style="font-size:3rem;">🔒</div><div>Admin access required</div><a href="login.html" style="color:#FF6B2B;">← Log in</a></div>`;
    return;
  }

  window.loadOverview = async function () {
    try {
      const data = await api('/admin/dashboard');
      const s    = data.stats;
      const setEl = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
      setEl('st-orders', s.totalOrders); setEl('st-rev', '$'+s.totalRevenue.toFixed(0));
      setEl('st-del', s.deliveredOrders); setEl('st-pend', s.pendingOrders);
      const badge = document.getElementById('pending-badge');
      if (badge) badge.textContent = s.pendingOrders;
      document.querySelectorAll('.stat-card').forEach((c,i)=>{ c.style.animationDelay=(i*.08)+'s'; c.classList.add('vis'); });
      const tbody = document.getElementById('recent-tbody');
      if (tbody && data.recentOrders) {
        tbody.innerHTML = data.recentOrders.map(o => `
          <tr>
            <td><span class="oid">#${o.orderId}</span></td>
            <td><div class="dt-date">${new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</div></td>
            <td><div class="dt-time">${new Date(o.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div></td>
            <td><div class="cust-cell"><div class="cust-av">${(o.user?.name||'C')[0]}</div><div class="cust-nm">${o.user?.name||'Customer'}</div></div></td>
            <td style="font-size:.73rem;color:rgba(255,200,150,.38);">${(o.items||[]).map(i=>`${i.quantity}×${i.pizzaName}`).join(', ').substring(0,40)}</td>
            <td><span class="price-val">$${o.total.toFixed(2)}</span></td>
            <td>${buildAdminSBadge(o.status)}</td>
          </tr>`).join('');
      }
      if (data.lowStockAlerts?.length) showToast(`${data.lowStockAlerts.length} pizza(s) low on stock!`, 'error');
    } catch (err) { console.warn('Admin overview:', err.message); }
  };

  window.loadOrders = async function () {
    const tbody = document.getElementById('orders-tbody'); if (!tbody) return;
    try {
      const filter = document.querySelector('#sec-orders .fchip.active')?.dataset.f || 'all';
      const search = document.getElementById('order-search')?.value || '';
      const data   = await api(`/orders?status=${filter}&search=${encodeURIComponent(search)}&limit=50`);
      if (!data.orders?.length) { tbody.innerHTML='<tr><td colspan="8"><div class="empty-st"><div class="ei">📭</div><p>No orders</p></div></td></tr>'; return; }
      tbody.innerHTML = data.orders.map(o => `
        <tr>
          <td><span class="oid">#${o.orderId}</span></td>
          <td><div class="dt-date">${new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div></td>
          <td><div class="dt-time">${new Date(o.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div></td>
          <td><div class="cust-cell"><div class="cust-av">${(o.user?.name||'C')[0]}</div><div><div class="cust-nm">${o.user?.name||'Customer'}</div><div class="cust-itm">${(o.items||[]).slice(0,2).map(i=>`${i.quantity}× ${i.pizzaName}`).join(', ')}</div></div></div></td>
          <td><span class="price-val">$${o.total.toFixed(2)}</span></td>
          <td>${buildAdminMPill(o.paymentMethod)}</td>
          <td>
            <select class="status-sel" onchange="adminUpdateStatus('${o._id}',this.value)">
              <option value="processing" ${o.status==='processing'?'selected':''}>Received</option>
              <option value="kitchen"    ${o.status==='kitchen'   ?'selected':''}>Kitchen</option>
              <option value="delivery"   ${o.status==='delivery'  ?'selected':''}>On the Way</option>
              <option value="delivered"  ${o.status==='delivered' ?'selected':''}>Delivered</option>
              <option value="cancelled"  ${o.status==='cancelled' ?'selected':''}>Cancelled</option>
            </select>
          </td>
          <td><div class="row-acts"><button class="r-btn" onclick="viewOrder('${o._id}')" title="View">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button></div></td>
        </tr>`).join('');
    } catch (err) { console.warn('Admin orders:', err.message); }
  };

  window.adminUpdateStatus = async (mongoId, newStatus) => {
    try {
      const data = await api(`/orders/${mongoId}/status`, { method:'PUT', body:JSON.stringify({status:newStatus}) });
      showToast(data.msg, 'success');
      window.loadOverview();
    } catch (err) { showToast(err.message, 'error'); }
  };

  window.loadInventory = async function () {
    try {
      const data = await api('/inventory');
      const inv  = data.inventory || [];
      const grid = document.getElementById('inv-grid'); if (!grid || !inv.length) return;
      grid.innerHTML = '';
      inv.forEach((item, i) => {
        const pct = Math.round((item.quantity / (item.maxStock||80)) * 100);
        const fc  = pct>=50?'f-hi':pct>=25?'f-md':'f-lo';
        const qc  = pct>=50?'hi':pct>=25?'md':'lo';
        const card = document.createElement('div'); card.className='inv-card'; card.style.animationDelay=(i*.06)+'s';
        card.innerHTML=`
          <div class="inv-hd"><img src="${item.pizza?.image||'pizza1.jpg'}" class="inv-img" onerror="this.src='pizza1.jpg'"><div><div class="inv-nm">${item.pizzaName}</div></div></div>
          <div class="inv-bar-bg"><div class="inv-bar-fill ${fc}" style="width:0"></div></div>
          <div class="inv-ft"><div><div class="inv-qn ${qc}">${item.quantity}</div><div class="inv-lbl">${pct<20?'Low Stock':pct>=80?'Full':'In Stock'}</div></div><div class="inv-pct">${pct}%</div></div>
          <div class="inv-acts">
            <button class="inv-btn i-re" onclick="apiQuickRestock('${item.pizza?._id}','${item.pizzaName}')">+20 Restock</button>
            <button class="inv-btn i-ed" onclick="openRst('${item.pizzaName}')">Edit Stock</button>
          </div>`;
        grid.appendChild(card);
        setTimeout(()=>{ card.classList.add('vis'); setTimeout(()=>{card.querySelector('.inv-bar-fill').style.width=pct+'%';},100); },10+i*60);
      });
      // Activity log
      const logEl = document.getElementById('inv-log-list');
      if (logEl) {
        const allLog = inv.flatMap(item=>(item.activityLog||[]).map(l=>({...l,pizza:item.pizzaName}))).sort((a,b)=>new Date(b.time)-new Date(a.time)).slice(0,15);
        logEl.innerHTML = allLog.length ? allLog.map(l=>`
          <div class="log-item">
            <div class="log-icon ${l.type}">${l.type==='deduct'?
              `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B2B" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></svg>`:
              `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6ee07a" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12,19 5,12 12,5"/></svg>`}
            </div>
            <div class="log-txt"><strong>${l.pizza}</strong> — ${l.note}</div>
            <div class="log-qty ${l.type==='deduct'?'neg':'pos'}">${l.type==='deduct'?'-':'+'}${l.qty}</div>
            <div class="log-time">${new Date(l.time).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
          </div>`).join('') : '<div class="empty-st"><div class="ei">📋</div><p>No activity yet</p></div>';
      }
    } catch (err) { console.warn('Admin inventory:', err.message); }
  };

  window.apiQuickRestock = async (pizzaId, pizzaName) => {
    if (!pizzaId || pizzaId === 'undefined') { showToast('Cannot restock — pizza not found', 'error'); return; }
    try {
      await api(`/inventory/${pizzaId}/restock`, { method:'POST', body:JSON.stringify({addQty:20,note:'Quick restock +20'}) });
      showToast(`${pizzaName} +20 restocked`, 'success');
      window.loadInventory();
    } catch (err) { showToast(err.message, 'error'); }
  };

  window.loadPizzaList = async function () {
    try {
      const data   = await api('/pizzas');
      window._adminPizzas = data.pizzas || [];
      const grid   = document.getElementById('pizza-list'); if (!grid) return;
      const pzFilter = document.querySelector('[data-pf].active')?.dataset.pf || 'all';
      let filtered = data.pizzas || [];
      if (pzFilter==='veg') filtered=filtered.filter(p=>p.category==='veg');
      else if (pzFilter==='nonveg') filtered=filtered.filter(p=>p.category==='nonveg');
      else if (pzFilter==='available') filtered=filtered.filter(p=>p.available);
      const countEl = document.getElementById('pz-count');
      if (countEl) countEl.textContent = `(${filtered.length} total)`;
      grid.innerHTML='';
      filtered.forEach((p,i)=>{
        const card=document.createElement('div'); card.className='pl-card'; card.style.animationDelay=(i*.06)+'s';
        card.innerHTML=`
          <img src="${p.image}" class="pl-img" onerror="this.src='pizza1.jpg'">
          <div class="pl-body">
            <div class="pl-nm">${p.name}</div>
            <div class="pl-desc">${p.description||'—'}</div>
            <div class="pl-ft">
              <span class="pl-price">$${p.price.toFixed(2)}</span>
              <div class="pl-acts">
                <span class="${p.available?'avail-on':'avail-off'}">${p.available?'Live':'Off'}</span>
                <button class="pl-btn" onclick="adminEditPizza('${p._id}')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="pl-btn del" onclick="adminDeletePizza('${p._id}','${p.name}')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14a2 2 0 0 1-2,2H8a2 2 0 0 1-2-2L5,6m5,0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1,1v2"/></svg>
                </button>
              </div>
            </div>
          </div>`;
        grid.appendChild(card);
        setTimeout(()=>card.classList.add('vis'),10+i*60);
      });
    } catch (err) { console.warn('Admin pizza list:', err.message); }
  };

  window.adminEditPizza = (id) => {
    const p = (window._adminPizzas||[]).find(x=>x._id===id); if(!p)return;
    window.editingId=id;
    const sv=(elId,v)=>{const e=document.getElementById(elId);if(e)e.value=v;};
    sv('p-nm',p.name); sv('p-desc',p.description); sv('p-price',p.price);
    sv('p-cat',p.category); sv('p-stock',0); sv('p-avail',p.available?'true':'false');
    const st=document.getElementById('submit-txt'); if(st) st.textContent='Update Pizza';
    if(typeof prevUrl==='function') prevUrl(p.image);
    sv('p-img-url',p.image);
    if(typeof updatePreview==='function') updatePreview();
    document.getElementById('sec-add-pizza')?.scrollIntoView({behavior:'smooth'});
    showToast(`Editing: ${p.name}`,'info');
  };

  window.adminDeletePizza = async (id, name) => {
    if(!confirm(`Delete "${name}"?`)) return;
    try { const data=await api(`/pizzas/${id}`,{method:'DELETE'}); showToast(data.msg,'success'); window.loadPizzaList(); }
    catch(err) { showToast(err.message,'error'); }
  };

  const pizzaForm = document.getElementById('pizza-form');
  if (pizzaForm) {
    pizzaForm.addEventListener('submit', async function(e) {
      e.preventDefault(); e.stopPropagation();
      const name=document.getElementById('p-nm')?.value.trim();
      const desc=document.getElementById('p-desc')?.value.trim();
      const price=parseFloat(document.getElementById('p-price')?.value);
      const cat=document.getElementById('p-cat')?.value;
      const stock=parseInt(document.getElementById('p-stock')?.value)||50;
      const avail=document.getElementById('p-avail')?.value==='true';
      const img=document.getElementById('p-img-url')?.value.trim()||'pizza1.jpg';
      if(!name||isNaN(price)||price<=0){showToast('Fill all required fields.','error');return;}
      const btn=document.getElementById('pizza-submit');
      if(btn) btn.classList.add('loading');
      try {
        let data;
        if(window.editingId) data=await api(`/pizzas/${window.editingId}`,{method:'PUT',body:JSON.stringify({name,description:desc,price,category:cat,image:img,available:avail})});
        else data=await api('/pizzas',{method:'POST',body:JSON.stringify({name,description:desc,price,category:cat,image:img,available:avail,stock})});
        showToast(data.msg,'success');
        window.editingId=null;
        if(btn) btn.classList.remove('loading');
        if(typeof resetForm==='function') resetForm();
        window.loadPizzaList(); window.loadInventory();
      } catch(err) { showToast(err.message,'error'); if(btn) btn.classList.remove('loading'); }
    },true);
  }

  window.loadPayments = async function () {
    try {
      const data=await api('/payments');
      const setEl=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
      setEl('pay-total','$'+(data.totalRevenue||0).toFixed(2));
      setEl('pay-count',data.payments?.length||0);
      setEl('pay-avg','$'+(data.payments?.length?(data.totalRevenue/data.payments.length):0).toFixed(2));
      const tbody=document.getElementById('pay-tbody'); if(!tbody||!data.payments)return;
      tbody.innerHTML=data.payments.map(p=>`
        <tr>
          <td><span class="oid">#${p.orderId}</span></td>
          <td><div class="dt-date">${new Date(p.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</div></td>
          <td><div class="dt-time">${new Date(p.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div></td>
          <td><span class="price-val">$${p.amount.toFixed(2)}</span></td>
          <td>${buildAdminMPill(p.method)}</td>
          <td>${buildAdminSBadge(p.status==='paid'?'delivered':'processing')}</td>
        </tr>`).join('');
    } catch(err) { console.warn('Admin payments:',err.message); }
  };

  const logoutBtn = document.querySelector('.logout-btn');
  if (logoutBtn) logoutBtn.onclick = () => { Auth.clear(); window.location.href = 'login.html'; };
}

// Admin helper functions
function buildAdminSBadge(status) {
  const map={processing:['s-recv','Received'],kitchen:['s-kitch','In Kitchen'],delivery:['s-delv','On the Way'],delivered:['s-done','Delivered'],cancelled:['s-cancel','Cancelled']};
  const[cls,label]=map[status]||['s-recv',status];
  return `<span class="sbadge ${cls}"><span class="dot"></span>${label}</span>`;
}
function buildAdminMPill(m) {
  const ml=(m||'').toLowerCase();
  if(ml.includes('razorpay')) return`<span class="mpill m-rzp">Razorpay</span>`;
  if(ml.includes('card'))     return`<span class="mpill m-card">Card</span>`;
  if(ml.includes('upi'))      return`<span class="mpill m-upi">UPI</span>`;
  return`<span class="mpill m-cod">COD</span>`;
}

// ── NAVBAR ────────────────────────────────────────────────────────────────
function initNavbar() {
  updateCartCount();
  const user = Auth.getUser();
  if (!user || document.getElementById('sec-overview')) return;
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;
  const loginLink = navLinks.querySelector('a[href="login.html"]');
  const regLink   = navLinks.querySelector('a[href="registration.html"]');
  if (loginLink) loginLink.style.display = 'none';
  if (regLink)   regLink.style.display   = 'none';
  if (!document.getElementById('nav-user-pill')) {
    const pill = document.createElement('div');
    pill.id = 'nav-user-pill';
    pill.style.cssText = 'display:flex;align-items:center;gap:.5rem;';
    pill.innerHTML = `
      <span style="font-size:.82rem;color:rgba(255,200,150,.6);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:3px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        ${user.name.split(' ')[0]}
      </span>
      <button onclick="Auth.clear();window.location.href='login.html'"
        style="background:none;border:1px solid rgba(255,80,80,.25);border-radius:8px;color:rgba(255,120,120,.5);font-size:.75rem;padding:.28rem .65rem;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:.3rem;"
        onmouseover="this.style.color='#ff8080'" onmouseout="this.style.color='rgba(255,120,120,.5)'">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Logout
      </button>`;
    navLinks.appendChild(pill);
  }
}

// ── INIT ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initLoginPage();
  initRegisterPage();
  initForgotPage();
  initDashboardPage();
  initCartPage();
  initPaymentPage();
  initOrderPage();
  initAdminPage();
});
