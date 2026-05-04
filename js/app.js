"use strict";

/* ===== Paths ===== */
const BASE_PATH = location.pathname.includes("/tinkers-live/")
  ? "/tinkers-live"
  : "";

const PRODUCTS_URL = BASE_PATH + "/products.json";
const CART_KEY = "tinkers_cart_v1";

/* ===== Products ===== */
async function loadProducts() {
  try {
    const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load products.json");
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

/* ===== Render products ===== */
function renderProducts(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  grid.innerHTML = "";

  const filtered =
    category === "All"
      ? products
      : products.filter(p => p.category === category);

  filtered.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="images/${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="price">R${p.price}</p>
      <button onclick="addToCart('${p.id}')">Add to cart</button>
    `;

    grid.appendChild(card);
  });
}

/* ===== Categories ===== */
function wireCategoryLinks(products) {
  document.querySelectorAll("nav a[data-filter]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const cat = link.dataset.filter;
      renderProducts(products, cat);
    });
  });
}

/* ===== Cart ===== */
function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(id) {
  const cart = readCart();
  const item = cart.find(i => i.id === id);

  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  alert("Added to cart");
}

function renderCart(products) {
  const el = document.getElementById("cart");
  if (!el) return;

  const cart = readCart();
  if (!cart.length) {
    el.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  el.innerHTML = "";
  cart.forEach(line => {
    const p = products.find(x => x.id === line.id);
    if (!p) return;

    el.innerHTML += `
      <div class="card">
        <img src="images/${p.image}">
        <h3>${p.name}</h3>
        <p>Qty: ${line.qty}</p>
        <p>R${p.price * line.qty}</p>
      </div>
    `;
  });
}
function clearCart() {
  localStorage.removeItem(CART_KEY);

  const cartEl = document.getElementById("cart");
  if (cartEl) {
    cartEl.innerHTML = "<p>Your cart is empty.</p>";
  }

  alert("Cart cleared");
}

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", async () => {
  const products = await loadProducts();
  window.__products = products;

  if (document.getElementById("products")) {
    renderProducts(products);
    wireCategoryLinks(products);
  }

  if (document.getElementById("cart")) {
    renderCart(products);
  }
});
