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
   CART COUNT
================================ */
function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  el.textContent = readCart().reduce((t, i) => t + i.qty, 0);
}

/* ===============================
   LOAD PRODUCTS
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

/* ===============================
   ADD TO CART
================================ */
function addToCart(id) {

  const product = window.__products.find(p => p.id === id);
  if (!product) return;

  const cart = readCart();
  const item = cart.find(i => i.id === id);

  if (item) item.qty++;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  updateCartCount();

  alert(product.name + " added ✅");
}

/* ===============================
   UPDATE QTY
================================ */
function updateQty(id, change) {
  const cart = readCart();
  const item = cart.find(i => i.id === id);

  if (!item) return;

  item.qty += change;

  if (item.qty <= 0) {
    removeItem(id);
    return;
  }

  writeCart(cart);
  renderCheckout();
  updateCartCount();
}

/* ===============================
   REMOVE ITEM
================================ */
function removeItem(id) {
  let cart = readCart();
  cart = cart.filter(i => i.id !== id);

  writeCart(cart);
  renderCheckout();
  updateCartCount();
}

/* ===============================
   CLEAR CART
================================ */
function clearCart() {
  localStorage.removeItem(CART_KEY);
  renderCheckout();
  updateCartCount();
}

/* ===============================
   CHECKOUT GRID
================================ */
function renderCheckout() {

  const cartEl = document.getElementById("cart");
  const totalEl = document.getElementById("checkoutTotal");

  if (!cartEl || !totalEl) return;

  const cart = readCart();

  if (!cart.length) {
    cartEl.innerHTML = "<p>Your cart is empty</p>";
    totalEl.textContent = "R0";
    return;
  }

  let total = 0;

  cartEl.innerHTML = `<div class="checkout-grid"></div>`;
  const grid = cartEl.querySelector(".checkout-grid");

  cart.forEach(item => {

    const product = window.__products.find(p => p.id === item.id);
    if (!product) return;

    const subtotal = product.price * item.qty;
    total += subtotal;

    grid.innerHTML += `
      <div class="checkout-card">
        <img class="checkout-img" src="images/${product.image}">
        
        <div class="checkout-info">
          <h3>${product.name}</h3>

          <div class="qty-row">
            <button onclick="updateQty('${item.id}', -1)">−</button>
            <span>${item.qty}</span>
            <button onclick="updateQty('${item.id}', 1)">+</button>
            <button onclick="removeItem('${item.id}')">Remove</button>
          </div>

          <p>R${subtotal}</p>
        </div>
      </div>
    `;
  });

  totalEl.textContent = "R" + total;

  /* ✅ FIX PAYFAST */
  const pf = document.getElementById("payfastAmount");
  if (pf) pf.value = total.toFixed(2);
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();
  window.__products = products;

  updateCartCount();

  if (document.getElementById("cart")) {
    renderCheckout();
  }
});
