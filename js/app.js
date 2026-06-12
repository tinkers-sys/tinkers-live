"use strict";

let allProducts = [

  {
    id: 45758375591970, // ✅ Shopify variant ID
    name: "African Print Off-Shoulder Dress",
    price: 850,
    image: "https://cdn.shopify.com/s/files/your-image-link.jpg"
  },

  {
    id: 45758375591971,
    name: "African Map Earrings",
    price: 250,
    image: "images/africa-map-earrings.jpg"
  }

];

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
        '${escapeQuotes(p.name)}',
        ${p.price},
        '${p.image}'
      )">
        Add to Cart
      </button>
    </div>
  `;
}

function escapeQuotes(text) {
  return text.replace(/'/g, "\\'");
}

/* ===============================
✅ RENDER PRODUCTS
=============================== */
function renderProducts(products) {

  const container = document.querySelector(".products");

  if (!container) {
    console.error("Products container missing");
    return;
  }

  let html = "";
  products.forEach(p => html += buildCard(p));

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

  // ✅ animation
  const btn = document.querySelector(".cart-btn");
  if (btn) {
    btn.style.transform = "scale(1.1)";
    setTimeout(() => btn.style.transform = "scale(1)", 200);
  }
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
✅ CART DRAWER
=============================== */
function toggleCart() {

  const drawer = document.getElementById("cartDrawer");
  if (!drawer) return;

  drawer.style.right =
    drawer.style.right === "0px" ? "-350px" : "0px";
}

/* ===============================
✅ SHOPIFY CHECKOUT
=============================== */
function goToShopifyCheckout() {

  const cart = getCart();

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  let cartString = cart.map(item =>
    item.id + ":" + item.qty
  ).join(",");

  window.location.href =
    "https://tinkers-8375.myshopify.com/cart/" +
    cartString +
    "?checkout";
}

/* ===============================
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", function () {
  renderProducts(allProducts);
  updateCartUI();
});
``
