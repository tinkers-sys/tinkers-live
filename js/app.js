"use strict";

let allProducts = [];

/* =============================== 
✅ FORMAT CURRENCY
=============================== */
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR"
  }).format(amount);
}

/* ===============================
✅ LOAD PRODUCTS FROM GOOGLE SHEETS
=============================== */
function loadProducts() {
  return new Promise((resolve) => {

    window.handleProducts = function(data) {
      console.log("✅ Products loaded:", data);

      if (!data || data.length === 0) {
        console.warn("⚠️ No data from Google Sheets — using fallback");
        resolve(getFallbackProducts());
      } else {
        resolve(data);
      }
    };

    const script = document.createElement("script");

    script.src =
      "https://script.google.com/macros/s/AKfycbwo9mFy7pUgQN5BtfVx-DQXn4kRFJbQPKkvXw93yE3budYgAWiv6k3xJeBmZrPXe2YR/exec";

    script.onerror = () => {
      console.error("❌ Failed to load script — using fallback");
      resolve(getFallbackProducts());
    };

    document.body.appendChild(script);
  });
}

/* ===============================
✅ FALLBACK PRODUCTS (TEST MODE)
=============================== */
function getFallbackProducts() {
  return [
    {
      id: "1",
      name: "Test Bead Necklace",
      price: 150,
      image: "https://via.placeholder.com/200"
    }
  ];
}

/* ===============================
✅ BUILD PRODUCT CARD
=============================== */
function buildCard(p) {
  return `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${formatCurrency(p.price)}</p>

      <button onclick="addToCart(
        '${p.id}',
        '${p.name.replace(/'/g, "\\'")}',
        ${p.price},
        '${p.image}'
      )">
        Add to Cart
      </button>
    </div>
  `;
}

/* ===============================
✅ RENDER PRODUCTS
=============================== */
function renderProducts(products) {

  const container = document.querySelector(".products");

  if (!container) {
    console.error("❌ Missing .products container in HTML");
    return;
  }

  let html = "";

  products.forEach(p => {
    html += buildCard(p);
  });

  container.innerHTML = html;
}

/* ===============================
✅ CART SYSTEM
=============================== */
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id, name, price, image) {

  let cart = getCart();
  let item = cart.find(i => i.id === id);

  if (item) {
    item.qty++;
  } else {
    cart.push({ id, name, price, image, qty: 1 });
  }

  saveCart(cart);
  updateCartUI();
}

/* ===============================
✅ UPDATE CART UI
=============================== */
function updateCartUI() {

  let cart = getCart();
  let totalItems = 0;

  cart.forEach(item => totalItems += item.qty);

  const badge = document.querySelector(".cart-count");
  if (badge) badge.innerText = totalItems;
}

/* ===============================
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();

  allProducts = products;

  renderProducts(products);

  updateCartUI();
});
