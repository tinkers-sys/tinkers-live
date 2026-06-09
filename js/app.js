"use strict";
let allProducts = [];
let cart = [];

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

  let stockText = "";
  let stock = parseInt(p.stock) || 0;

  let disabled = "";

  if (stock <= 0) {
    stockText = "<p style='color:red;'>Out of Stock</p>";
    disabled = "disabled";
  } else if (stock <= 3) {
    stockText = "<p style='color:red;'>Only " + stock + " left 🔥</p>";
  } else if (stock <= 5) {
    stockText = "<p style='color:orange;'>Low stock (" + stock + ")</p>";
  }

  return `
    <div class="product-card" style="border:1px solid #ccc; padding:15px; margin:10px; border-radius:8px;">
      
      <img src="images/${p.image}" style="width:100%; height:200px; object-fit:cover;">
      
      <h3>${p.name}</h3>
      
      <p>${formatCurrency(p.price)}</p>

      ${stockText}

      <button onclick="addToCart('${p.id}','${p.name}',${p.price},'${p.image}',${stock})"
        ${disabled}
        style="padding:8px 12px; background:#ff6600; color:white; border:none; border-radius:5px; cursor:pointer;">
        Add to Cart
      </button>

    </div>
  `;
}
function addToCart(id, name, price, image, stock) {

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  let item = cart.find(i => i.id === id);

  if (item) {
    item.qty += 1;
  } else {
    cart.push({
      id,
      name,
      price,
      image,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));

  updateCartUI();
}
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}
function updateCartUI() {

  let cart = getCart();

  let totalItems = 0;

  cart.forEach(item => {
    totalItems += item.qty;
  });

  let badge = document.querySelector(".cart-count");

  if (badge) badge.innerText = totalItems;
}

  // Update cart badge
  let badge = document.querySelector(".cart-count");
  if (badge) badge.innerText = totalItems;

  // Update cart drawer
  let cartItems = document.getElementById("cartItems");

  if (cartItems) {

    cartItems.innerHTML = "";

    cart.forEach(function(item){

      cartItems.innerHTML += `
        <div style="padding:10px; border-bottom:1px solid #ccc;">
          <strong>${item.name}</strong><br>
          ${item.qty} x R ${item.price}
        </div>
      `;
    });
  }

  // Update total
  let totalEl = document.getElementById("cartTotal");
  if (totalEl) {
    totalEl.innerText = "R " + totalPrice.toFixed(2);
  }
}
function toggleCart() {

  let drawer = document.getElementById("cartDrawer");

  if (!drawer) return;

  if (drawer.style.right === "0px") {
    drawer.style.right = "-400px";
  } else {
    drawer.style.right = "0px";
  }
}

function renderProducts(products) {

  let html = "";

  for (let i = 0; i < products.length; i++) {
    html += buildCard(products[i]);
  }

  document.getElementById("products").innerHTML = html;
}
function setupFilters() {

  const buttons = document.querySelectorAll("nav a[data-filter]");

  buttons.forEach(function(btn){

    btn.addEventListener("click", function(e){
      e.preventDefault();

      const filter = btn.dataset.filter.toLowerCase();

      let filtered;

      if (filter === "all") {
        filtered = allProducts;
      } else {
        filtered = allProducts.filter(function(p){
          return (p.category || "").toLowerCase() === filter;
        });
      }

      renderProducts(filtered);
    });

  });

}

/* ===============================
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", async function(){

  const container = document.getElementById("products");

  try {

    const products = await loadProducts();
    allProducts = products; // ✅ store globally

    renderProducts(products); // ✅ initial load

    setupFilters(); // ✅ activate filters

    console.log("✅ PRODUCTS DISPLAYED");

  } catch (err) {

    console.error(err);

    container.innerHTML =
      "<p style='color:red;'>Failed to load products ❌</p>";
  }

});
