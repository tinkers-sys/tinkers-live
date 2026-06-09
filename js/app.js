"use strict";

/* ===============================
✅ CURRENCY FORMAT
=============================== */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
}

/* ===============================
✅ CONFIG
=============================== */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzp2yPn_MyqzxjEHxuxkIP356GRRPDGYLDZXM0sSYM/exec";

/* ===============================
✅ CART
=============================== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ===============================
✅ LOAD PRODUCTS
=============================== */
async function loadProducts() {

  const url = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1?t=" + Date.now();

  const res = await fetch(url);

  if (!res.ok) throw new Error("Sheet fetch failed");

  const data = await res.json();

  console.log("✅ DATA:", data);

  return data.map(p => ({
    id: p.id || p.name,
    name: p.name || "Unknown",
    price: parseFloat(p.price) || 0,
    image: p.image || "default.jpg",
    category: (p.category || "").toLowerCase(),
    stock: parseInt(p.stock) || 0
  }));
}

/* ===============================
✅ PRODUCT CARD
=============================== */
function buildCard(p) {

  let stockText = "";
  let disabled = "";

  if (p.stock <= 0) {
    stockText = `<p style="color:red;">Out of Stock</p>`;
    disabled = "disabled";
  } else if (p.stock <= 3) {
    stockText = `<p style="color:red;">Only ${p.stock} left 🔥</p>`;
  } else if (p.stock <= 5) {
    stockText = `<p style="color:orange;">Low stock (${p.stock})</p>`;
  }

  return `
    <div class="product-card">
      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p>${formatCurrency(p.price)}</p>
      ${stockText}
      <button class="add-btn"
        onclick="addToCart('${p.id}', '${p.name}', ${p.price}, '${p.image}', ${p.stock})"
        ${disabled}>
        Add to cart
      </button>
    </div>
  `;
}

/* ===============================
✅ ADD TO CART
=============================== */
function addToCart(id, name, price, image, stock) {

  let item = cart.find(i => i.id === id);

  if (item) {
    if (item.qty >= stock) {
      alert("Stock limit reached ❌");
      return;
    }
    item.qty++;
  } else {
    cart.push({ id, name, price, image, qty: 1, stock });
  }

  saveCart();
}

/* ===============================
✅ SAVE CART
=============================== */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
}

/* ===============================
✅ CART UI
=============================== */
function updateCartUI() {

  let total = 0;
  let count = 0;

  cart.forEach(i => {
    total += i.price * i.qty;
    count += i.qty;
  });

  const badge = document.querySelector(".cart-count");
  if (badge) badge.innerText = count;

  const totalEl = document.getElementById("cartTotal");
  if (totalEl) totalEl.innerText = formatCurrency(total);
}

/* ===============================
✅ FILTERS
=============================== */
function setupFilters(products) {

  document.querySelectorAll("nav a[data-filter]").forEach(btn => {

    btn.addEventListener("click", e => {
      e.preventDefault();

      const filter = btn.dataset.filter;

      const filtered =
        filter === "all"
          ? products
          : products.filter(p => p.category === filter);

      document.getElementById("products").innerHTML =
        filtered.map(buildCard).join("");
    });

  });
}

/* ===============================
✅ STOCK UPDATE
=============================== */
function updateStock(id, qty) {
  fetch(`${SCRIPT_URL}?id=${id}&qty=${qty}&t=${Date.now()}`)
    .then(res => res.text())
    .then(data => console.log("Stock updated:", data))
    .catch(err => console.error(err));
}

/* ===============================
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", async () => {

  try {

    updateCartUI();

    const container = document.getElementById("products");

    if (!container) return;

    const products = await loadProducts();

    container.innerHTML = products.map(buildCard).join("");

    setupFilters(products);

    console.log("✅ PRODUCTS LOADED");

  } catch (err) {

    console.error("❌ ERROR:", err);

    document.getElementById("products").innerHTML =
      "<p style='color:red;'>Failed to load products ❌</p>";
  }

});
