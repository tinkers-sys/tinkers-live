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
✅ LOAD PRODUCTS
=============================== */
async function loadProducts() {
  const res = await fetch("https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1");

  if (!res.ok) throw new Error("Fetch failed");

  return await res.json();
}

/* ===============================
✅ BUILD PRODUCT CARD
=============================== */
function buildCard(p) {

  let stock = parseInt(p.stock) || 0;
  let stockText = "";
  let disabled = "";

  if (stock <= 0) {
    stockText = "<p style='color:red;'>Out of Stock</p>";
    disabled = "disabled";
  } else if (stock <= 3) {
    stockText = "<p style='color:red;'>Only " + stock + " left 🔥</p>";
  }

  return `
    <div class="product-card">
      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p>${formatCurrency(p.price)}</p>
      ${stockText}

      <button onclick="addToCart('${p.id}','${p.name}',${p.price},'${p.image}',${stock})" ${disabled}>
        Add to Cart
      </button>
    </div>
  `;
}

/* ===============================
✅ CART SYSTEM
=============================== */
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function addToCart(id, name, price, image) {

  let cart = getCart();

  let item = cart.find(i => i.id === id);

  if (item) {
    item.qty += 1;
  } else {
    cart.push({ id, name, price, image, qty: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  updateCartUI();
}

/* ===============================
✅ UPDATE CART UI
=============================== */
function updateCartUI() {

  let cart = getCart();

  let totalItems = 0;
  let totalPrice = 0;

  cart.forEach(item => {
    totalItems += item.qty;
    totalPrice += item.qty * item.price;
  });

  let badge = document.querySelector(".cart-count");
  if (badge) badge.innerText = totalItems;

  let cartItems = document.getElementById("cartItems");

  if (cartItems) {
    cartItems.innerHTML = "";

    cart.forEach(item => {
      cartItems.innerHTML += `
        <div style="padding:10px; border-bottom:1px solid #ccc;">
          <strong>${item.name}</strong><br>
          ${item.qty} x ${formatCurrency(item.price)}
        </div>
      `;
    });
  }

  let totalEl = document.getElementById("cartTotal");
  if (totalEl) totalEl.innerText = formatCurrency(totalPrice);
}

/* ===============================
✅ TOGGLE CART
=============================== */
function toggleCart() {

  let drawer = document.getElementById("cartDrawer");

  if (!drawer) return;

  if (drawer.style.right === "0px") {
    drawer.style.right = "-350px";
  } else {
    drawer.style.right = "0px";
  }
}

/* ===============================
✅ RENDER PRODUCTS
=============================== */
function renderProducts(products) {

  let html = "";

  for (let i = 0; i < products.length; i++) {
    html += buildCard(products[i]);
  }

  document.getElementById("products").innerHTML = html;
}

/* ===============================
✅ FILTERS
=============================== */
function setupFilters() {

  const buttons = document.querySelectorAll("nav a[data-filter]");

  buttons.forEach(btn => {

    btn.addEventListener("click", function(e){
      e.preventDefault();

      const filter = this.dataset.filter.toLowerCase();

      let filtered;

      if (filter === "all") {
        filtered = allProducts;
      } else {
        filtered = allProducts.filter(p =>
          (p.category || "").toLowerCase() === filter
        );
      }

      renderProducts(filtered);
    });

  });
}

/* ===============================
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", async function(){

  try {

    const products = await loadProducts();
    allProducts = products;

    renderProducts(products);
    setupFilters();
    updateCartUI(); // ✅ important for badge

    console.log("✅ PRODUCTS LOADED");

  } catch (err) {

    console.error(err);

    document.getElementById("products").innerHTML =
      "<p style='color:red;'>Failed to load products ❌</p>";
  }

});
``
