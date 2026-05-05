
"use strict";

const BASE_PATH = location.pathname.includes("/tinkers-live/") ? "/tinkers-live" : "";
const PRODUCTS_URL = BASE_PATH + "/products.json";
const CART_KEY = "tinkers_cart_v1";

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
  const count = readCart().reduce((s, i) => s + i.qty, 0);
  el.textContent = count;
}

async function loadProducts() {
  const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
  return await res.json();
}

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

function addToCart(id) {
  const cart = readCart();
  const item = cart.find(i => i.id === id);
  item ? item.qty++ : cart.push({ id, qty: 1 });
  writeCart(cart);
  updateCartCount();
}

document.addEventListener("DOMContentLoaded", async () => {
  const products = await loadProducts();
  window.__products = products;

  // ✅ ALWAYS update cart count on page load
  updateCartCount();

  // ✅ Home page
  const productsGrid = document.getElementById("products");
  if (productsGrid) {
    renderProducts(products, "All");
    wireCategoryLinks(products);
  }

  // ✅ Checkout page
  const cartEl = document.getElementById("cart");
  if (cartEl) {
    renderCheckout(products);
  }
});
