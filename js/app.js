"use strict";

let allProducts = [];

/* ===============================
✅ FORMAT
=============================== */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
}

/* ===============================
✅ LOAD PRODUCTS (SHOPIFY)
=============================== */
async function loadProducts() {
  try {
    const res = await fetch(
      "https://tinkers-8375.myshopify.com/products.json"
    );

    const data = await res.json();

    if (!data.products || data.products.length === 0) {
      document.querySelector(".products").innerHTML =
        "<p>No products available</p>";
      return [];
    }

    return data.products.map(p => ({
      id: p.variants[0].id,
      name: p.title,
      price: parseFloat(p.variants[0].price),
      image: p.images[0]?.src || ""
    }));

  } catch (err) {
    console.error("Product load error:", err);

    document.querySelector(".products").innerHTML =
      "<p>Failed to load products</p>";

    return [];
  }
}

/* ===============================
✅ BUILD PRODUCT CARD (FIXED)
=============================== */
function buildCard(p) {
  return `
    <div class="product-card">
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${formatCurrency(p.price)}</p>

      <button onclick="addToCart('${p.id}','${p.name}',${p.price},'${p.image}')">
        Add to Cart
      </button>
    </div>
  `;
}

/* ===============================
✅ RENDER PRODUCTS (FIXED TARGET)
=============================== */
function renderProducts(products) {
  let html = "";
  products.forEach(p => html += buildCard(p));

  document.querySelector(".products").innerHTML = html;
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
✅ UPDATE CART
=============================== */
function updateCartUI() {

  let cart = getCart();
  let totalItems = 0;

  cart.forEach(item => {
    totalItems += item.qty;
  });

  let badge = document.querySelector(".cart-count");
  if (badge) badge.innerText = totalItems;
}

/* ===============================
✅ INIT (CLEAN VERSION)
=============================== */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();

  allProducts = products;
  renderProducts(products);

});
