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

  const qty = readCart().reduce((total, item) => total + (Number(item.qty) || 0), 0);
  el.textContent = qty;
}

/* ===============================
   LOAD PRODUCTS
================================ */
function normalizeId(p) {
  return String(p.id || p.ID || p.product_id || "");
}

async function loadProducts() {
  const res = await fetch(PRODUCTS_URL);
  const data = await res.json();

  return data.map(p => ({
    ...p,
    id: normalizeId(p),
    price: Number(p.price),
    stock: Number(p.stock || 0)
  }));
}

/* ===============================
   ADD TO CART
================================ */
function addToCart(id) {

  id = String(id);

  const cart = readCart();
  const item = cart.find(i => String(i.id) === id);

  if (item) {
    item.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }

  writeCart(cart);
  updateCartCount();
}

/* ===============================
   PRODUCT CARD
================================ */
function buildCard(p) {
  return `
    <div class="card">
      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p class="price">R${p.price}</p>
      <button onclick="addToCart('${p.id}')">Add to cart</button>
    </div>
  `;
}

/* ===============================
   FEATURED
================================ */
function renderFeatured(products) {
  const el = document.getElementById("featuredProducts");
  if (!el) return;

  el.innerHTML = products.map(buildCard).join("");
}

/* ===============================
   TRENDING
================================ */
function renderTrending(products) {
  const el = document.getElementById("trendingProducts");
  if (!el) return;

  el.innerHTML = products.map(buildCard).join("");
}

/* ===============================
   MAIN SHOP
================================ */
function renderProducts(products, category = "All") {

  const grid = document.getElementById("products");
  if (!grid) return;

  const filtered = category === "All"
    ? products
    : products.filter(p => p.category === category);

  grid.innerHTML = filtered.map(buildCard).join("");
}

/* ===============================
   FILTERS
================================ */
function wireCategoryLinks(products) {

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", function(e) {
      e.preventDefault();

      renderProducts(products, this.dataset.filter);
    });

  });
}

/* ===============================
   CHECKOUT
================================ */
function updateQty(id, change) {

  const cart = readCart();
  const item = cart.find(i => String(i.id) === String(id));

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

function removeItem(id) {
  const cart = readCart().filter(i => String(i.id) !== String(id));
  writeCart(cart);
  renderCheckout();
  updateCartCount();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  renderCheckout();
  updateCartCount();
}

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

    total += product.price * item.qty;

    grid.innerHTML += `
      <div class="checkout-card">
        <img class="checkout-img" src="images/${product.image}">
        <h3>${product.name}</h3>
        <p>R${product.price}</p>

        <div class="qty-row">
          <button onclick="updateQty('${item.id}', -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="updateQty('${item.id}', 1)">+</button>
        </div>

        <button onclick="removeItem('${item.id}')">Remove</button>
      </div>
    `;
  });

  totalEl.textContent = "R" + total;
}

/* ===============================
   INIT (FIXED NO DUPLICATION)
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();
  window.__products = products;

  updateCartCount();

  /* ✅ SPLIT PRODUCTS (CRITICAL FIX) */
  const featuredProducts = products.slice(0, 4);
  const trendingProducts = products.slice(4, 10);
  const shopProducts = products.slice(10);

  if (document.getElementById("featuredProducts")) {
    renderFeatured(featuredProducts);
  }

  if (document.getElementById("trendingProducts")) {
    renderTrending(trendingProducts);
  }

  if (document.getElementById("products")) {
    renderProducts(shopProducts, "All");
    wireCategoryLinks(shopProducts);
  }

  if (document.getElementById("cart")) {
    renderCheckout();
  }

});

/* ===============================
   GLOBAL
================================ */
window.addToCart = addToCart;
window.updateQty = updateQty;
window.removeItem = removeItem;
window.clearCart = clearCart;
