"use strict";

/* ===============================
   CONFIG
================================ */
const PRODUCTS_URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";
const CART_KEY = "tinkers_cart_v1";

/* ===============================
   STORAGE
================================ */
function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}
function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

/* ===============================
   UI: COUNT + TOAST (no annoying OK popup)
================================ */
function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  const qty = readCart().reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  el.textContent = String(qty);
}

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position:fixed; bottom:20px; right:20px;
      background:#c55a11; color:#fff;
      padding:12px 16px; border-radius:10px;
      z-index:9999; font-weight:600;
      box-shadow:0 10px 25px rgba(0,0,0,.18);
      display:none;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toast.style.display = "none"), 1600);
}

/* ===============================
   PRODUCTS (LOAD + NORMALIZE IDS)
================================ */
function normalizeId(p) {
  const raw = p.id ?? p.ID ?? p.product_id ?? p.ProductID ?? p.ProductId ?? p.Id;
  return raw == null ? "" : String(raw);
}

async function loadProducts() {
  const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map(p => ({
    ...p,
    id: normalizeId(p),
    price: Number(p.price) || 0,
    stock: (p.stock === "" || p.stock == null) ? Infinity : Number(p.stock)
  }));
}

/* ===============================
   STOCK HELPERS (cart-based stock display)
================================ */
function qtyInCart(id) {
  const cart = readCart();
  const item = cart.find(i => String(i.id) === String(id));
  return item ? Number(item.qty) || 0 : 0;
}

function availableStock(product) {
  if (product.stock === Infinity) return Infinity;
  return Math.max(0, Number(product.stock) - qtyInCart(product.id));
}

/* ===============================
   RENDER: PRODUCTS
================================ */
function renderProducts(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  grid.className = "product-grid";
  grid.innerHTML = "";

  const filtered = category === "All"
    ? products
    : products.filter(p => (p.category || "").trim().toLowerCase() === String(category).trim().toLowerCase());

  filtered.forEach(p => {
    const avail = availableStock(p);

    let badge = "";
    let stockNote = "";
    let disabled = "";

    if (avail !== Infinity) {
      if (avail <= 0) { badge = `<div class="badge out">OUT</div>`; stockNote = "Out of stock"; disabled = "disabled"; }
      else if (avail === 1) { badge = `<div class="badge low">LAST ITEM</div>`; stockNote = "Only 1 left"; }
      else if (avail <= 3) { badge = `<div class="badge low">LOW STOCK</div>`; stockNote = `Only ${avail} left`; }
    }

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      ${badge}
      <img src="images/${p.image}" alt="${p.name}" loading="lazy">
      <h3>${p.name}</h3>
      <p class="price">R${p.price}</p>
      <p class="stock-note">${stockNote}</p>
      <button ${disabled} onclick="addToCart('${p.id}')">Add to cart</button>
    `;
    grid.appendChild(card);
  });
}

/* ===============================
   FILTERS
================================ */
function wireCategoryLinks(products) {
  document.querySelectorAll(".filters a").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelectorAll(".filters a").forEach(x => x.classList.remove("active"));
      this.classList.add("active");

      const selected = this.dataset.filter || "All";
      renderProducts(products, selected);
    });
  });
}

/* ===============================
   CART ACTIONS (FIXED ID MATCH)
================================ */
function addToCart(id) {
  id = String(id);

  const product = window.__products.find(p => String(p.id) === id);
  if (!product) {
    console.log("Product not found for id:", id);
    showToast("Could not add item");
    return;
  }

  const avail = availableStock(product);
  if (avail !== Infinity && avail <= 0) {
    showToast("Out of stock");
    return;
  }

  const cart = readCart();
  const item = cart.find(i => String(i.id) === id);

  if (item) item.qty = (Number(item.qty) || 0) + 1;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  updateCartCount();
  showToast(`${product.name} added ✅`);

  if (document.getElementById("products")) {
    const active = document.querySelector(".filters a.active")?.dataset?.filter || "All";
    renderProducts(window.__products, active);
  }
  if (document.getElementById("cart")) renderCheckout();
}

function updateQty(id, change) {
  id = String(id);
  const cart = readCart();
  const item = cart.find(i => String(i.id) === id);
  if (!item) return;

  const product = window.__products.find(p => String(p.id) === id);
  const current = Number(item.qty) || 0;
  const next = current + change;

  if (next <= 0) {
    removeItem(id);
    return;
  }

  if (product && product.stock !== Infinity && next > Number(product.stock)) {
    showToast("No more stock available");
    return;
  }

  item.qty = next;
  writeCart(cart);
  updateCartCount();
  renderCheckout();
}

function removeItem(id) {
  id = String(id);
  const cart = readCart().filter(i => String(i.id) !== id);
  writeCart(cart);
  updateCartCount();
  renderCheckout();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
  renderCheckout();
  showToast("Cart cleared");
}

/* ===============================
   CHECKOUT RENDER (GRID + IMAGES)
================================ */
function renderCheckout() {
  const cartEl = document.getElementById("cart");
  const totalEl = document.getElementById("checkoutTotal");
  if (!cartEl || !totalEl) return;

  const cart = readCart();

  if (!window.__products || !window.__products.length) {
    cartEl.innerHTML = "<p>Loading cart...</p>";
    totalEl.textContent = "R0";
    return;
  }

  if (!cart.length) {
    cartEl.innerHTML = "<p>Your cart is empty</p>";
    totalEl.textContent = "R0";
    const pf0 = document.getElementById("payfastAmount");
    if (pf0) pf0.value = "0.00";
    return;
  }

  let total = 0;
  cartEl.innerHTML = `<div class="checkout-grid"></div>`;
  const grid = cartEl.querySelector(".checkout-grid");

  cart.forEach(item => {
    const id = String(item.id);
    const qty = Number(item.qty) || 0;

    const product = window.__products.find(p => String(p.id) === id);
    if (!product) return;

    const subtotal = product.price * qty;
    total += subtotal;

   grid.innerHTML += `
  <div class="checkout-card">

    <img class="checkout-img" src="images/${product.image}" />

    <h3>${product.name}</h3>

    <p class="price">R${product.price}</p>

    <div class="qty-row">
      <button onclick="updateQty('${id}', -1)">−</button>
      <span>${qty}</span>
      <button onclick="updateQty('${id}', 1)">+</button>
    </div>

    <button class="remove-btn" onclick="removeItem('${id}')">
      Remove
    </button>

  </div>
`;

  totalEl.textContent = "R" + total;

  const pf = document.getElementById("payfastAmount");
  if (pf) pf.value = total.toFixed(2);
}

/* ===============================
   WHATSAPP CHECKOUT
================================ */
function whatsappCart() {
  const cart = readCart();
  if (!cart.length) return showToast("Cart is empty");

  let msg = "Hi Tinkers, I would like to order:\n\n";
  let total = 0;

  cart.forEach(item => {
    const id = String(item.id);
    const qty = Number(item.qty) || 0;
    const product = window.__products.find(p => String(p.id) === id);
    if (!product) return;
    const line = product.price * qty;
    total += line;
    msg += `• ${product.name} x${qty} - R${line}\n`;
  });

  msg += `\nTotal: R${total}`;
  window.open("https://wa.me/27682525454?text=" + encodeURIComponent(msg), "_blank");
}

function payflexCheckout() { showToast("Payflex demo clicked"); }

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const products = await loadProducts();
  window.__products = products;

  updateCartCount();

  if (document.getElementById("products")) {
    renderProducts(products, "All");
    wireCategoryLinks(products);
  }

  if (document.getElementById("cart")) {
    renderCheckout();
  }
});

/* expose for inline onclick */
window.addToCart = addToCart;
window.updateQty = updateQty;
window.removeItem = removeItem;
window.clearCart = clearCart;
window.whatsappCart = whatsappCart;
window.payflexCheckout = payflexCheckout;
