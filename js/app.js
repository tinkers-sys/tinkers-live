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
✅ LOAD PRODUCTS (GOOGLE SCRIPT)
=============================== */
async function loadProducts() {
  try {

    const res = await fetch("https://script.google.com/macros/s/AKfycbxMJDXaelAPuERs83_0IQU0mi8VDwcr9h08dEZPph90LJE5bKWuNzHZ-fuJIp3N2xdY/exec");
    const data = await res.json();

    console.log("✅ Products loaded:", data);

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(p => ({
      id: p.id,                      // ✅ MUST be Shopify variant ID
      name: p.name,
      price: parseFloat(p.price),
      image: p.image                // must be full URL
    }));

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

      <button onclick="addToCart('${p.id}','${escapeQuotes(p.name)}',${p.price},'${p.image}')">
        Add to Cart
      </button>
    </div>
  `;
}

/* ===============================
✅ ESCAPE QUOTES (IMPORTANT)
=============================== */
function escapeQuotes(text) {
  return text.replace(/'/g, "\\'");
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
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();

  allProducts = products;
  renderProducts(products);
  updateCartUI();

});
