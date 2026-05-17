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

/* ✅ TOAST MESSAGE */
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
      color:white;
      padding:12px 18px;
      border-radius:6px;
      z-index:9999;
      font-weight:600;
    `;
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

/* ===============================
   PRODUCTS
================================ */
async function loadProducts() {
  const res = await fetch(PRODUCTS_URL);
  const data = await res.json();

  return data.map(p => ({
    ...p,
    price: Number(p.price)
  }));
}

/* ✅ FIXED GRID + RENDER */
function renderProducts(products, category = "All") {

  const grid = document.getElementById("products");
  if (!grid) return;

  grid.className = "product-grid";
  grid.innerHTML = "";

  const filtered = category === "All"
    ? products
    : products.filter(p =>
        p.category &&
        p.category.toLowerCase().trim() === category.toLowerCase().trim()
      );

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

/* ✅ FIXED FILTER */
function wireCategoryLinks(products) {

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", function (e) {
      e.preventDefault();

      const selected = this.dataset.filter || "All";

      renderProducts(products, selected);
    });

  });
}

/* ===============================
   CART
================================ */
function addToCart(id) {

  const cart = readCart();
  const item = cart.find(i => i.id === id);

  if (item) item.qty++;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  updateCartCount();

  showToast("Added to cart ✅");
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();
  window.__products = products;

  updateCartCount();

  renderProducts(products, "All");
  wireCategoryLinks(products);

});
