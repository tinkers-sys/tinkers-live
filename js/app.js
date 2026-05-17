"use strict";

/* ===============================
   CONFIG
================================ */
const PRODUCTS_URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";
const CART_KEY = "tinkers_cart_v1";

/* ===============================
   HELPERS
================================ */
function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  el.textContent = readCart().reduce((s, i) => s + i.qty, 0);
}

/* ✅ TOAST */
function showToast(msg) {
  let toast = document.getElementById("toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.style.cssText = `
      position:fixed; bottom:20px; right:20px;
      background:#c55a11; color:white;
      padding:12px 16px; border-radius:6px;
      z-index:9999;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = msg;
  toast.style.display = "block";

  setTimeout(() => toast.style.display = "none", 2000);
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

/* ===============================
   RENDER PRODUCTS
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
    btn.addEventListener("click", e => {
      e.preventDefault();
      renderProducts(products, btn.dataset.filter);
    });
  });
}

/* ===============================
   CART
================================ */
function addToCart(id) {

  const product = window.__products.find(p => p.id === id);
  if (!product) return;

  const cart = readCart();

  const existing = cart.find(i => i.id === id);

  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, qty: 1 });
  }

  writeCart(cart);
  updateCartCount();
  showToast(`${product.name} added ✅`);
}

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

function removeItem(id) {
  let cart = readCart();
  cart = cart.filter(i => i.id !== id);

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
   CHECKOUT RENDER
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
}
function payflexCheckout() {

  const cart = readCart();
  if (!cart.length) return alert("Cart is empty");

  let total = 0;

  cart.forEach(item => {
    const product = window.__products.find(p => p.id === item.id);
    total += product.price * item.qty;
  });

  alert("Payflex sandbox payment\n\nTotal: R" + total);

}


/* ===============================
   WHATSAPP CHECKOUT
================================ */
function whatsappCart() {

  const cart = readCart();
  if (!cart.length) return alert("Cart empty");

  let message = "Hello, I want to order:\n\n";

  cart.forEach(item => {
    const product = window.__products.find(p => p.id === item.id);
    message += `${product.name} x${item.qty} - R${product.price * item.qty}\n`;
  });

  window.open(
    "https://wa.me/27682525454?text=" + encodeURIComponent(message),
    "_blank"
  );
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
``
