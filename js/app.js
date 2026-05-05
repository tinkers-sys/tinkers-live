"use strict";

/* ===============================
   CONFIG
================================ */
const BASE_PATH = location.pathname.includes("/tinkers-live/") ? "/tinkers-live" : "";
const PRODUCTS_URL = BASE_PATH + "/products.json";
const CART_KEY = "tinkers_cart_v1";

/* ===============================
   CART HELPERS
================================ */
function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
  if (document.getElementById("cart")) renderCheckout();
}

/* ===============================
   UI HELPERS
================================ */
function moneyZAR(n) {
  return "R" + Number(n || 0).toLocaleString("en-ZA");
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  const totalQty = readCart().reduce((s, i) => s + i.qty, 0);
  el.textContent = totalQty;
}

function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position:fixed;
      bottom:20px;
      right:20px;
      background:#c55a11;
      color:#fff;
      padding:12px 18px;
      border-radius:6px;
      z-index:9999;
      font-weight:600;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.display = "block";
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (toast.style.display = "none"), 2000);
}

/* ===============================
   PRODUCTS
================================ */
async function loadProducts() {
  const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

function renderProducts(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  const list =
    category === "All"
      ? products
      : products.filter(p => p.category === category);

  grid.innerHTML = list
    .map(
      p => `
      <div class="card">
        <img src="images/${p.image}" alt="${p.name}" loading="lazy">
        <h3>${p.name}</h3>
        <p class="category">${p.category}</p>
        <p class="price">${moneyZAR(p.price)}</p>
        <button onclick="addToCart('${p.id}')">Add to cart</button>
      </div>
    `
    )
    .join("");
}

function wireCategoryLinks(products) {
  document.querySelectorAll("nav a[data-filter]").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      renderProducts(products, a.dataset.filter || "All");
    });
  });
}

/* ===============================
   CART ACTIONS
================================ */
function addToCart(id) {
  const cart = readCart();
  const item = cart.find(i => i.id === id);

  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  updateCartCount();

  const product = window.__products.find(p => p.id === id);
  showToast(`${product.name} added to cart`);
}
function updateQty(id, delta) {
  const cart = readCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  const updated = cart.filter(i => i.qty > 0);
  writeCart(updated);

  updateCartCount();
  renderCheckout();
}

function removeFromCart(id) {
  const updated = readCart().filter(i => i.id !== id);
  writeCart(updated);
  updateCartCount();
  renderCheckout();
}

/* ===============================
   CHECKOUT RENDERING
================================ */
function renderCheckout() {
  const cartEl = document.getElementById("cart");
  const totalEl = document.getElementById("checkoutTotal");
  if (!cartEl || !totalEl) return;

  const cart = readCart();
  if (!cart.length) {
    cartEl.innerHTML = "<p>Your cart is empty.</p>";
    totalEl.textContent = "R0";
    return;
  }

  let total = 0;
  cartEl.innerHTML = `<div class="checkout-grid"></div>`;
  const grid = cartEl.querySelector(".checkout-grid");

  cart.forEach(item => {
    const product = window.__products.find(p => p.id === item.id);
    if (!product) return;

    const lineTotal = product.price * item.qty;
    total += lineTotal;

    grid.innerHTML += `
      <div class="checkout-card">
        <img class="checkout-thumb" src="images/${product.image}" alt="${product.name}">

        <div class="checkout-info">
          <strong>${product.name}</strong>

          <div class="qty-row">
            <button onclick="updateQty('${product.id}', -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="updateQty('${product.id}', 1)">+</button>
            <button class="remove-btn" onclick="removeFromCart('${product.id}')">Remove</button>
          </div>

          <div class="checkout-line">
            ${moneyZAR(lineTotal)}
          </div>
        </div>
      </div>
    `;
  });

  totalEl.textContent = moneyZAR(total);
}
/* ===============================
   PAYFAST
================================ */
function payNow() {
  const cart = readCart();
  if (!cart.length) {
    alert("Your cart is empty");
    return;
  }

  let total = 0;
  let items = [];

  cart.forEach(item => {
    const p = window.__products.find(x => x.id === item.id);
    if (!p) return;
    total += p.price * item.qty;
    items.push(`${p.name} x${item.qty}`);
  });

  document.getElementById("pf_amount").value = total.toFixed(2);
  document.getElementById("pf_item_name").value = items.join(", ");

  document.getElementById("payfastForm").submit();
}

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
