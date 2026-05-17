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
  if (el) {
    el.textContent = readCart().reduce((s, i) => s + i.qty, 0);
  }
}

/* ===============================
   LOAD PRODUCTS
================================ */
async function loadProducts() {
  const res = await fetch(PRODUCTS_URL);
  const data = await res.json();

  return data.map(p => ({
    ...p,
    id: p.id || p.ID || p.product_id,   // ✅ FIX ID MAPPING
    price: Number(p.price),
    stock: Number(p.stock)
  }));
}

/* ===============================
   ADD TO CART ✅ FIXED
================================ */
function addToCart(id) {

  const product = window.__products.find(p => p.id == id);
  if (!product) {
    console.log("Product not found:", id);
    return;
  }

  const cart = readCart();
  const item = cart.find(i => i.id == id);

  if (item) item.qty++;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  updateCartCount();

  alert(product.name + " added ✅");
}

/* ===============================
   PRODUCT GRID ✅ FIXED HTML
================================ */
function renderProducts(products, category = "All") {

  const grid = document.getElementById("products");
  if (!grid) return;

  grid.className = "product-grid";
  grid.innerHTML = "";

  const filtered = category === "All"
    ? products
    : products.filter(p => p.category === category);

  filtered.forEach(p => {

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="images/${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>R${p.price}</p>
      <button onclick="addToCart('${p.id}')">Add to cart</button>
    `;

    grid.appendChild(card);
  });
}

/* ===============================
   FILTER
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
   CART FUNCTIONS
================================ */
function updateQty(id, change) {
  const cart = readCart();
  const item = cart.find(i => i.id == id);
  if (!item) return;

  item.qty += change;

  if (item.qty <= 0) return removeItem(id);

  writeCart(cart);
  renderCheckout();
  updateCartCount();
}

function removeItem(id) {
  const cart = readCart().filter(i => i.id != id);
  writeCart(cart);
  renderCheckout();
  updateCartCount();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  renderCheckout();
  updateCartCount();
}

/* ===============================
   CHECKOUT ✅ WORKING
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

    const product = window.__products.find(p => p.id == item.id);
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

  if (document.getElementById("products")) {
    renderProducts(products, "All");
    wireCategoryLinks(products);
  }

  if (document.getElementById("cart")) {
    renderCheckout();
  }

});
