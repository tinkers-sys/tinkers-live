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

/* ✅ FIXED GRID RENDER */
function renderProducts(products) {

  const grid = document.getElementById("products");
  if (!grid) return;

  grid.innerHTML = ""; // clear first

  products.forEach(p => {

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="images/${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.category}</p>
      <p>R${p.price}</p>
      <button onclick="addToCart('${p.id}')">Add to cart</button>
    `;

    grid.appendChild(card);
  });
}

/* ===============================
   FILTER (FIXED ✅)
================================ */
function wireCategoryLinks(products) {

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", e => {
      e.preventDefault();

      const filter = btn.dataset.filter;

      if (!filter || filter === "All") {
        renderProducts(products);
        return;
      }

      const filtered = products.filter(p =>
        p.category &&
        p.category.toLowerCase().trim() === filter.toLowerCase().trim()
      );

      renderProducts(filtered);
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
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();
  window.__products = products;

  updateCartCount();

  renderProducts(products);
  wireCategoryLinks(products);

});
