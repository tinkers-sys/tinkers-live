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
✅ LOAD PRODUCTS (WITH CORS FIX)
=============================== */
async function loadProducts() {
  try {

    const url = "https://tinkers-8375.myshopify.com/products.json";

    // ✅ WORKING proxy (stable)
    const proxy = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url);

    const res = await fetch(proxy);

    if (!res.ok) {
      throw new Error("Failed to fetch data");
    }

    const data = await res.json();

    console.log("✅ Shopify products:", data);

    if (!data.products || data.products.length === 0) {
      return [];
    }

    return data.products.map(p => {

      if (!p.variants || p.variants.length === 0) return null;

      const v = p.variants[0];

      return {
        id: v.id,
        name: p.title,
        price: parseFloat(v.price),
        image: (p.images && p.images.length > 0) ? p.images[0].src : ""
      };

    }).filter(Boolean);

  } catch (err) {
    console.error("❌ LOAD FAILED:", err);
    return [];
  }
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
    console.error("❌ Products container not found");
    return;
  }

  if (!products || products.length === 0) {
    container.innerHTML = "<p>No products available</p>";
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

  // ✅ small animation
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
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();

  allProducts = products;
  renderProducts(products);
  updateCartUI();

});
