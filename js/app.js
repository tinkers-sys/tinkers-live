"use strict";

/* Paths */
const BASE_PATH = location.pathname.includes("/tinkers-live/") ? "/tinkers-live" : "";
const PRODUCTS_URL = BASE_PATH + "/products.json";

/* Cart */
const CART_KEY = "tinkers_cart_v1";

/* WhatsApp */
const WHATSAPP_NUMBER = "27682525454";

/* Helpers */
function moneyZAR(n) {
  return "R" + Number(n || 0).toLocaleString("en-ZA");
}

function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  const totalQty = readCart().reduce((sum, item) => sum + item.qty, 0);
  el.textContent = totalQty;
}

/* Load products */
async function loadProducts() {
  const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
  return await res.json();
}

/* Home grid */
function renderProducts(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  const list = category === "All"
    ? products
    : products.filter(p => p.category === category);

  grid.innerHTML = list.map(p => `
    <div class="card">
      <img src="images/${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="price">${moneyZAR(p.price)}</p>
      <button onclick="addToCart('${p.id}')">Add to cart</button>
    </div>
  `).join("");
}

function wireCategoryLinks(products) {
  document.querySelectorAll("nav a[data-filter]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      renderProducts(products, link.dataset.filter);
    });
  });
}

/* Cart actions */
function addToCart(id) {
  const cart = readCart();
  const item = cart.find(i => i.id === id);
  item ? item.qty++ : cart.push({ id, qty: 1 });
  writeCart(cart);
  updateCartCount();
}

function updateQty(id, delta) {
  const cart = readCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  writeCart(cart.filter(i => i.qty > 0));
  updateCartCount();
  renderCheckout(window.__products);
}

function removeFromCart(id) {
  writeCart(readCart().filter(i => i.id !== id));
  updateCartCount();
  renderCheckout(window.__products);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
  renderCheckout(window.__products);
}

/* Checkout */
function renderCheckout(products) {
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
  cartEl.innerHTML = "";

  cart.forEach(item => {
    const p = products.find(x => x.id === item.id);
    const line = p.price * item.qty;
    total += line;

    cartEl.innerHTML += `
      <div class="card">
        <img src="images/${p.image}">
        <h3>${p.name}</h3>
        <p>Qty: ${item.qty}</p>
        <p>${moneyZAR(line)}</p>
      </div>
    `;
  });

  totalEl.textContent = moneyZAR(total);
}

/* Init */
document.addEventListener("DOMContentLoaded", async () => {
  const products = await loadProducts();
  window.__products = products;
  updateCartCount();

  if (document.getElementById("products")) {
    renderProducts(products);
    wireCategoryLinks(products);
  }

  if (document.getElementById("cart")) {
    renderCheckout(products);
  }
});
