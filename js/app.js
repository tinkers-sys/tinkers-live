"use strict";

/* ===============================
✅ CURRENCY FORMAT
=============================== */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2
  }).format(amount);
}

/* ===============================
✅ CONFIG
=============================== */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzp2yPn_MyqzxjEHxuxkIP356GRRPDGYLDZXM0sSYM/exec";

/* ===============================
✅ CART STATE
=============================== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ===============================
✅ LOAD PRODUCTS
=============================== */
async function loadProducts() {

  const res = await fetch(
    "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1?t=" + Date.now()
  );

  if (!res.ok) {
    throw new Error("Failed to fetch product data");
  }

  const data = await res.json();

  console.log("✅ Data received:", data);

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

  let stockMessage = "";
  let disabled = "";

  if (p.stock <= 0) {
    stockMessage = `<p style="color:red;">Out of Stock</p>`;
    disabled = "disabled";
  }
  else if (p.stock <= 3) {
    stockMessage = `<p style="color:red;">Only ${p.stock} left 🔥</p>`;
  }
  else if (p.stock <= 5) {
    stockMessage = `<p style="color:orange;">Low stock (${p.stock} left)</p>`;
  }

  return `
    <div class="product-card">

      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p>${formatCurrency(p.price)}</p>

      ${stockMessage}

      <button class="add-btn"
        onclick="addToCart('${p.id}', '${p.name}', ${p.price}, '${p.image}', ${p.stock})"
        ${disabled}>
        ${p.stock <= 0 ? "Out of Stock" : "Add to cart"}
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
      alert("Only " + stock + " items available ❌");
      return;
    }

    item.qty += 1;

  } else {

    cart.push({
      id,
      name,
      price,
      image,
      qty: 1,
      stock
    });

  }

  saveCart();
}

/* ===============================
✅ SAVE CART
=============================== */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
  renderCheckout();
}

/* ===============================
✅ CART UI
=============================== */
function updateCartUI() {

  let totalItems = 0;
  let totalPrice = 0;

  cart.forEach(item => {
    totalItems += item.qty;
    totalPrice += item.price * item.qty;
  });

  const badge = document.querySelector(".cart-count");
  if (badge) badge.innerText = totalItems;

  const el = document.getElementById("cartItems");

  if (el) {
    el.innerHTML = "";

    cart.forEach(item => {

      const subtotal = item.price * item.qty;

      el.innerHTML += `
        <div class="cart-item">

          <span>${item.name}</span>

          <div class="qty-controls">
            <button onclick="changeQty('${item.id}',1)">+</button>
            <button onclick="changeQty('${item.id}',-1)">-</button>
          </div>

          <span>${formatCurrency(subtotal)}</span>
        </div>
      `;
    });
  }

  const totalEl = document.getElementById("cartTotal");
  if (totalEl) {
    totalEl.innerText = formatCurrency(totalPrice);
  }
}

/* ===============================
✅ CHANGE QTY
=============================== */
function changeQty(id, amt) {

  let item = cart.find(i => i.id === id);
  if (!item) return;

  if (amt > 0 && item.qty >= item.stock) {
    alert("Max stock reached ❌");
    return;
  }

  item.qty += amt;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  saveCart();
}

/* ===============================
✅ CHECKOUT
=============================== */
function renderCheckout() {

  const grid = document.getElementById("checkoutGrid");
  const totalEl = document.getElementById("checkoutTotal");

  if (!grid) return;

  grid.innerHTML = "";
  let total = 0;

  cart.forEach(item => {

    const subtotal = item.price * item.qty;
    total += subtotal;

    grid.innerHTML += `
      <div class="product-card">
        <img src="images/${item.image}">
        <h3>${item.name}</h3>

        <p>${item.qty} x ${formatCurrency(item.price)}</p>

        <strong>${formatCurrency(subtotal)}</strong>
      </div>
    `;
  });

  if (totalEl) {
    totalEl.innerText = formatCurrency(total);
  }
}

/* ===============================
✅ FILTERS (THIS FIXES YOUR ISSUE)
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
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", async () => {

  try {

    console.log("✅ Page loaded");

    updateCartUI();

    if (document.getElementById("checkoutGrid")) {
      renderCheckout();
    }

    const container = document.getElementById("products");

    if (container) {

      console.log("🔄 Loading products...");

      const products = await loadProducts();

      console.log("✅ Products:", products);

      container.innerHTML = products.map(buildCard).join("");

      setupFilters(products);

      console.log("✅ Products rendered");

    }

  } catch (err) {

    console.error("❌ ERROR:", err);

    document.getElementById("products").innerHTML =
      "<p style='color:red;'>Error loading products ❌</p>";
  }

});
