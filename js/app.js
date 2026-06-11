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

    // ✅ Use CORS proxy (this fixes your issue)
    const url = "https://tinkers-8375.myshopify.com/products.json";
    const proxy = "https://api.allorigins.win/get?url=" + encodeURIComponent(url);

    const res = await fetch(proxy);
    const proxyData = await res.json();

    const data = JSON.parse(proxyData.contents);

    console.log("✅ Shopify products:", data);

    if (!data.products || data.products.length === 0) {
      document.querySelector(".products").innerHTML =
        "<p>No products available</p>";
      return [];
    }

    return data.products.map(p => ({
      id: p.variants[0].id,
      name: p.title,
      price: parseFloat(p.variants[0].price),
      image: p.images?.length > 0 ? p.images[0].src : ""
    }));

  } catch (err) {
    console.error("❌ Product load error:", err);

    document.querySelector(".products").innerHTML =
      "<p style='color:red;'>Failed to load products</p>";

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
