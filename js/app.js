"use strict";

let allProducts = [];

/* ===============================
✅ FORMAT CURRENCY
=============================== */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
}

/* ===============================
✅ LOAD PRODUCTS FROM SHOPIFY
=============================== */
async function loadProducts() {
  try {

    const res = await fetch("https://tinkers-8375.myshopify.com/products.json");

    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }

    const data = await res.json();

    console.log("✅ LIVE Shopify products:", data);

    const products = data.products;

    if (!products || products.length === 0) {
      return [];
    }

    return products.map(p => {
      const variant = p.variants[0];

      return {
        id: variant.id,
        name: p.title,
        price: parseFloat(variant.price),
        image: p.images.length > 0 ? p.images[0].src : ""
      };
    });

  } catch (error) {
    console.error("❌ ERROR LOADING PRODUCTS:", error);
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
    console.error("❌ Products container NOT FOUND");
    return;
  }

  if (!products || products.length === 0) {
    container.innerHTML = "<p>No products found</p>";
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
  let item = cart.find(i => i.id == id);

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

  cart.forEach(item => {
    totalItems += item.qty;
  });

  let badge = document.querySelector(".cart-count");
  if (badge) badge.innerText = totalItems;
}

/* ===============================
✅ CART DRAWER
=============================== */
function toggleCart() {
  let drawer = document.getElementById("cartDrawer");
  if (!drawer) return;

  drawer.style.right =
    drawer.style.right === "0px" ? "-350px" : "0px";
}

/* ===============================
✅ INIT (CLEAN)
=============================== */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();

  allProducts = products;
  renderProducts(products);
  updateCartUI();

});
