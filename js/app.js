// Tinkers: auto-render products from products.json (GitHub Pages friendly)

const PRODUCTS_URL = 'products.json';
const CART_KEY = 'tinkers_cart_v1';

/* ---------- Helpers ---------- */
function moneyZAR(value) {
  const n = Number(value || 0);
  return 'R' + n.toLocaleString('en-ZA');
}
function availabilityLabel(p){
  const a = (p.availability || 'in_stock').toLowerCase();
  if (a === 'out_of_stock') return 'Out of stock';
  if (a === 'low_stock') return 'Low stock';
  if (a === 'preorder') return 'Pre‑order';
  return 'In stock';
}

function canAddToCart(p){
  if (p.type === 'original') return false;  // originals = enquiry only
  if ((p.availability || 'in_stock').toLowerCase() === 'out_of_stock') return false;
  return Number(p.stock ?? 0) > 0;
}


function getImage(p) {
  return (p && (p.image || p.filename))
    ? 'images/' + (p.image || p.filename)
    : '';
}

/* ---------- Cart ---------- */
function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(id) {
  const cart = readCart();
  const found = cart.find(x => x.id === id);

  if (found) found.qty += 1;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  updateCartCount();
  renderCartPanel(window.__products || []);
}

function updateQty(id, delta) {
  let cart = readCart();
  cart = cart
    .map(x => x.id === id ? { ...x, qty: x.qty + delta } : x)
    .filter(x => x.qty > 0);

  writeCart(cart);
  updateCartCount();
  renderCartPanel(window.__products || []);
  renderCheckout(window.__products || []);
}

function updateCartCount() {
  const el = document.getElementById('cartCount');
  if (!el) return;

  const count = readCart().reduce((sum, x) => sum + x.qty, 0);
  el.textContent = String(count);
}

/* ---------- Data ---------- */
async function loadProducts() {
  const res = await fetch('products.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('Could not load products.json');
  const data = await res.json();
  const products = Array.isArray(data) ? data : (data.products || []);
  window.__products = products;
  return products;
}


/* ---------- Navigation ---------- */
function wireNavFilters(products) {
  document.querySelectorAll('nav a[data-filter]').forEach(link => {
    link.addEventListener('click', e => {
      const cat = link.getAttribute('data-filter');
      renderHome(products, cat);
    });
  });
}

/* ---------- Homepage ---------- */
function renderHome(products, category = 'All') {
  const grid = document.getElementById('products');
  if (!grid) return;

  /* Featured Original Art */
  const originals = products.filter(p => p.type === 'original');
  const featured = document.getElementById('originalArt');

  if (featured && originals.length) {
    const p = originals[0];
    featured.style.display = 'block';
    featured.innerHTML = `
      <div class="featured-art-inner">
        <img class="featured-art-image" src="${getImage(p)}" alt="${p.name}">
        <div>
          <span class="art-badge">Original · Signed</span>
          <h2>${p.name}</h2>
          <p class="artist">By ${p.artist || 'Artist'}</p>
          <div class="art-meta">
            <span>Medium: ${p.medium || 'Canvas'}</span>
            <span>Edition: ${p.edition || 'One-of-one'}</span>
          </div>
          <div class="art-price">${moneyZAR(p.price)}</div>
          <a class="primary-btn" href="product.html?id=${encodeURIComponent(p.id)}">
            View Artwork Details
          </a>
        </div>
      </div>
    `;
  } else if (featured) {
    featured.style.display = 'none';
    featured.innerHTML = '';
  }

  /* Retail Products */
  const list = products.filter(p => p.type !== 'original');
  const filtered =
    category === 'All' ? list : list.filter(p => p.category === category);

  grid.innerHTML = filtered.map(p => `
    <div class="card">
      <img src="${getImage(p)}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="category">${p.category}</p>
      <p class="price">${moneyZAR(p.price)}</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <a class="secondary-btn" href="product.html?id=${encodeURIComponent(p.id)}">View</a>
        <button onclick="addToCart('${p.id.replace(/'/g, "\\'")}')">Add to cart</button>
      </div>
    </div>
  `).join('');
}

/* ---------- Product Page ---------- */
function renderProductDetail(products) {
  const root = document.getElementById('detailRoot');
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const p = products.find(x => x.id === id);

  if (!p) {
    root.innerHTML = '<div class="card">Product not found.</div>';
    return;
  }

  const isOriginal = p.type === 'original';

  root.innerHTML = `
    <section>
      <img src="${getImage(p)}"
           style="width:100%;max-width:720px;background:#000;padding:12px;border-radius:12px">
      <h1>${p.name}</h1>
      <p class="category">${p.category}${isOriginal && p.artist ? ' · ' + p.artist : ''}</p>
      <p class="price">${moneyZAR(p.price)}</p>

      ${isOriginal ? `
        <p>
          ${p.medium ? `<strong>Medium:</strong> ${p.medium}<br>` : ''}
          ${p.edition ? `<strong>Edition:</strong> ${p.edition}<br>` : ''}
          ${p.signed ? `<strong>Signed:</strong> Yes<br>` : ''}
        </p>
        <a class="primary-btn" href="checkout.html">Enquire / Reserve</a>
      ` : `
        <button onclick="addToCart('${p.id.replace(/'/g, "\\'")}')">Add to cart</button>
      `}
    </section>
  `;

  wireCartPanel(products);
  updateCartCount();
  renderCartPanel(products);
}

/* ---------- Cart Panel ---------- */
function wireCartPanel(products) {
  const panel = document.getElementById('cartPanel');
  const openBtn = document.getElementById('cartButton');
  const closeBtn = document.getElementById('closeCart');

  if (openBtn && panel) openBtn.onclick = () => panel.classList.add('open');
  if (closeBtn && panel) closeBtn.onclick = () => panel.classList.remove('open');

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-qty]');
    if (!btn) return;

    updateQty(btn.dataset.id, Number(btn.dataset.qty));
  });
}

function renderCartPanel(products) {
  const itemsEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if (!itemsEl || !totalEl) return;

  const cart = readCart();
  if (!cart.length) {
    itemsEl.innerHTML = '<p class="cart-note">Your cart is empty.</p>';
    totalEl.textContent = moneyZAR(0);
    return;
  }

  let total = 0;
  itemsEl.innerHTML = cart.map(ci => {
    const p = products.find(x => x.id === ci.id);
    if (!p) return '';
    const line = p.price * ci.qty;
    total += line;

    return `
      <div class="cart-item">
        <img src="${getImage(p)}">
        <div>
          <strong>${p.name}</strong><br>
          ${moneyZAR(p.price)}
          <div>
            <button data-qty="-1" data-id="${p.id}">−</button>
            Qty ${ci.qty}
            <button data-qty="1" data-id="${p.id}">+</button>
          </div>
        </div>
        <strong>${moneyZAR(line)}</strong>
      </div>
    `;
  }).join('');

  totalEl.textContent = moneyZAR(total);
}

/* ---------- Checkout ---------- */
function renderCheckout(products) {
  const cartEl = document.getElementById('cart');
  const totalEl = document.getElementById('checkoutTotal');
  if (!cartEl || !totalEl) return;

  const cart = readCart();
  if (!cart.length) {
    cartEl.innerHTML = '<p class="cart-note">Your cart is empty.</p>';
    totalEl.textContent = moneyZAR(0);
    return;
  }

  let total = 0;
  cartEl.innerHTML = cart.map(ci => {
    const p = products.find(x => x.id === ci.id);
    if (!p) return '';
    const line = p.price * ci.qty;
    total += line;

    return `
      <div class="checkout-item">
        <img src="${getImage(p)}">
        <div class="name">${p.name}</div>
        <strong>${moneyZAR(line)}</strong>
      </div>
    `;
  }).join('');

  totalEl.textContent = moneyZAR(total);
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    updateCartCount();
    const products = await loadProducts();

    if (document.getElementById('products')) {
      wireNavFilters(products);
      renderHome(products);
    }

    if (document.getElementById('detailRoot')) {
      renderProductDetail(products);
    }

    if (document.getElementById('checkoutTotal')) {
      renderCheckout(products);
    }
  } catch (err) {
    console.error(err);
  }
});
// trigger validation
