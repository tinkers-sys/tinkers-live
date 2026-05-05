"use strict";

const BASE_PATH = location.pathname.includes("/tinkers-live/") ? "/tinkers-live" : "";
const PRODUCTS_URL = BASE_PATH + "/products.json";
const CART_KEY = "tinkers_cart_v1";

/* ---- Cart helpers ---- */
function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}
function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  const qty = readCart().reduce((s, i) => s + (Number(i.qty) || 0), 0);
  el.textContent = String(qty);
}

/* ---- Products ---- */
async function loadProducts() {
  const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
  const data = await res.json();
  return Array.isArray(data) ? data : (data.products || []);
}

function moneyZAR(n) {
  return "R" + Number(n || 0).toLocaleString("en-ZA");
}

function renderProducts(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  const list =
    category === "All"
      ? products
      : products.filter(p => p.category === category);

  grid.innerHTML = list.map(p => `
    <div class="card">
      <img src="images/${p.image}" alt="${p.name}" loading="lazy">
      <h3>${p.name}</h3>
      <p class="category">${p.category || ""}</p>
      <p class="price">${moneyZAR(p.price)}</p>
      <button type="button" onclick="addToCart('${p.id}')">Add to cart</button>
    </div>
  `).join("");
}

function wireCategoryLinks(products) {
  document.querySelectorAll("nav a[data-filter]").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      renderProducts(products, a.dataset.filter || "All");
    });
  });
}

/* ---- Cart actions ---- */
function addToCart(id) {
  const cart = readCart();
  const item = cart.find(i => i.id === id);
  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });
  writeCart(cart);
  updateCartCount();
}

/* ---- Init ---- */
document.addEventListener("DOMContentLoaded", async () => {
  const products = await loadProducts();
  window.__products = products;

  updateCartCount(); // ✅ updates Checkout (x) immediately on page load

  if (document.getElementById("products")) {
    renderProducts(products, "All");
    wireCategoryLinks(products);
  }
});
function payNow() {
  const cart = readCart();
  if (!cart.length) {
    alert("Your cart is empty");
    return;
  }

  let total = 0;
  let items = [];

  cart.forEach(item => {
    const p = window.__products.find(x => x.id === item.id);
    if (!p) return;
    total += p.price * item.qty;
    items.push(`${p.name} x${item.qty}`);
  });

  document.getElementById("pf_amount").value = total.toFixed(2);
  document.getElementById("pf_item_name").value = items.join(", ");

  document.getElementById("payfastForm").submit();
}
