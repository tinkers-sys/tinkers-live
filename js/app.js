"use strict";

/* ===============================
   CONFIG
================================ */
const BASE_PATH = location.pathname.includes("/tinkers-live/") ? "/tinkers-live" : "";
const PRODUCTS_URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";
const CART_KEY = "tinkers_cart_v1";
const SOLD_KEY = "tinkers_sold";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3ZleL6269FAtILm43fwUz6mDB-XpzZwmizsTNFkpkYW6hxdYugiPS-uDE_gRmkrB-/exec";

/* ===============================
   HELPERS
================================ */
function readSold() {
  return JSON.parse(localStorage.getItem(SOLD_KEY) || "{}");
}

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
  const res = await fetch(PRODUCTS_URL);
  const data = await res.json();

  return data.map(p => ({
    ...p,
    price: Number(p.price),
    stock: Number(p.stock)
  }));
}

function renderProducts(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  const soldData = readSold();

  const list =
    category === "All"
      ? products
      : products.filter(p => p.category === category);

  grid.innerHTML = list.map(p => {

    const baseStock = typeof p.stock === "number" ? p.stock : Infinity;
    const soldQty = soldData[p.id] || 0;
    const availableStock = baseStock - soldQty;

    let stockNote = "";
    let buttonHTML = "";
    let badge = "";

    if (availableStock <= 0) {
      stockNote = "Out of stock";
      badge = `<div class="badge">OUT</div>`;
      buttonHTML = `<button disabled>Out of stock</button>`;

    } else if (availableStock === 1) {
      stockNote = "Only 1 left";
      badge = `<div class="badge">LAST ITEM</div>`;
      buttonHTML = `<button onclick="whatsappProduct('${p.name}')">Reserve</button>`;

    } else if (availableStock <= 3) {
      stockNote = `Only ${availableStock} left`;
      badge = `<div class="badge">LOW STOCK</div>`;
      buttonHTML = `<button onclick="addToCart('${p.id}')">Add to cart</button>`;

    } else {
      buttonHTML = `<button onclick="addToCart('${p.id}')">Add to cart</button>`;
    }

    return `
      <div class="card">
        ${badge}
        <img src="images/${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>${moneyZAR(p.price)}</p>
        ${buttonHTML}
      </div>
    `;
  }).join("");
}

/* ===============================
   CART
================================ */
function addToCart(id) {
  const product = window.__products.find(p => p.id === id);
  if (!product) return;

  const cart = readCart();
  const item = cart.find(i => i.id === id);

  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  updateCartCount();
  showToast(`${product.name} added to cart`);
}

function updateQty(id, delta) {
  const cart = readCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;

  const newQty = item.qty + delta;

  if (newQty <= 0) {
    removeFromCart(id);
    return;
  }

  item.qty = newQty;
  writeCart(cart);
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
   CHECKOUT (RESTORED ✅)
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
    const p = window.__products.find(x => x.id === item.id);
    if (!p) return;

    const lineTotal = p.price * item.qty;
    total += lineTotal;

    grid.innerHTML += `
      <div class="checkout-card">
        <img class="checkout-thumb" src="images/${p.image}">
        <div class="checkout-info">
          <strong>${p.name}</strong>

          <div class="qty-row">
            <button onclick="updateQty('${p.id}', -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="updateQty('${p.id}', 1)">+</button>
            <button onclick="removeFromCart('${p.id}')">Remove</button>
          </div>

          <div>${moneyZAR(lineTotal)}</div>
        </div>
      </div>
    `;
  });

  totalEl.textContent = moneyZAR(total);
}

/* ===============================
   WHATSAPP (SAFE + STABLE)
================================ */
function whatsappCart() {
  const cart = readCart();
  if (!cart.length) {
    alert("Your cart is empty");
    return;
  }

  let message = "Hi Tinkers, I would like to order:\n\n";
  let total = 0;

  const payload = [];

  cart.forEach(item => {
    const p = window.__products.find(x => x.id === item.id);
    if (!p) return;

    const lineTotal = p.price * item.qty;
    total += lineTotal;

    message += `• ${p.name} x${item.qty} - R${lineTotal}\n`;

    payload.push({
      product: p.name,
      qty: item.qty,
      total: lineTotal
    });
  });

  message += `\nTotal: R${total}`;

  // ✅ Reliable request sender
  const img = new Image();
  img.src = `${SCRIPT_URL}?order=${encodeURIComponent(JSON.stringify(payload))}`;

  clearCart();

  window.open(`https://wa.me/27682525454?text=${encodeURIComponent(message)}`);
}

function whatsappProduct(name) {
  window.open(`https://wa.me/27682525454?text=${encodeURIComponent(name)}`);
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
  }

  if (document.getElementById("cart")) {
    renderCheckout();
  }
});
