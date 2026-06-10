"use strict";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxMJDXaelAPuERs83_0IQU0mi8VDwcr9h08dEZPph90LJE5bKWuNzHZ-fuJIp3N2xdY/exec ";

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
      "<p>Failed to load products. Check connection.</p>";

    return [];
  }
}


/* ===============================
✅ BUILD PRODUCT CARD
=============================== */
function buildCard(p) {

  let stock = parseInt(p.stock) || 0;
  let disabled = stock <= 0 ? "disabled" : "";

  return `
    <div class="product-card">
      img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${formatCurrency(p.price)}</p>

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

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id, name, price, image, stock) {

  let cart = getCart();

  let item = cart.find(i => i.id === id);

  if (item) {
    if (item.qty >= stock) {
      alert("Stock limit reached");
      return;
    }
    item.qty++;
  } else {
    cart.push({ id, name, price, image, qty: 1 });
  }

  saveCart(cart);
  updateCartUI();

  // ✅ Animation
  const btn = document.querySelector(".cart-btn");
  if (btn) {
    btn.style.transform = "scale(1.1)";
    setTimeout(() => btn.style.transform = "scale(1)", 200);
  }
}

/* ===============================
✅ UPDATE CART
=============================== */
function updateCartUI() {

  let cart = getCart();
  let totalItems = 0;
  let totalPrice = 0;

  let cartItems = document.getElementById("cartItems");
  if (cartItems) cartItems.innerHTML = "";

  cart.forEach(item => {

    totalItems += item.qty;
    totalPrice += item.qty * item.price;

    if (cartItems) {
      cartItems.innerHTML += `
        <div class="cart-item">
          <img src="images/${item.image}">
          <div class="cart-info">
            <strong>${item.name}</strong>
            <p>${item.qty} × ${formatCurrency(item.price)}</p>

            <div class="qty-controls">
              <button onclick="changeQty('${item.id}',1)">+</button>
              <button onclick="changeQty('${item.id}',-1)">−</button>
            </div>

            <strong>${formatCurrency(item.qty * item.price)}</strong>
          </div>
        </div>
      `;
    }
  });

  let badge = document.querySelector(".cart-count");
  if (badge) badge.innerText = totalItems;

  let totalEl = document.getElementById("cartTotal");
  if (totalEl) totalEl.innerText = formatCurrency(totalPrice);
}

/* ===============================
✅ CHANGE QTY
=============================== */
function changeQty(id, amount) {

  let cart = getCart();
  let item = cart.find(i => i.id === id);

  if (!item) return;

  item.qty += amount;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  saveCart(cart);
  updateCartUI();
}
function processOrder() {

  let cart = getCart();

  if (cart.length === 0) {
    alert("Cart empty ❌");
    return;
  }

  cart.forEach(item => {

    // ✅ Deduct stock
    fetch(`${SCRIPT_URL}?id=${item.id}&qty=${item.qty}`);

    // ✅ Log order
    fetch(`${SCRIPT_URL}?log=1&id=${item.id}&name=${item.name}&qty=${item.qty}&price=${item.price}`);

  });

  localStorage.removeItem("cart");
  updateCartUI();

  alert("✅ Order processed successfully");
}


/* ===============================
✅ CART UI
=============================== */
function clearCart() {
  localStorage.removeItem("cart");
  updateCartUI();
}

function toggleCart() {
  let drawer = document.getElementById("cartDrawer");
  if (!drawer) return;
  drawer.style.right = drawer.style.right === "0px" ? "-350px" : "0px";
}

/* ===============================
✅ PRODUCTS + FILTERS
=============================== */
function renderProducts(products) {
  let html = "";
  products.forEach(p => html += buildCard(p));
  document.getElementById("products").innerHTML = html;
}

function setupFilters() {
  document.querySelectorAll("nav a[data-filter]").forEach(btn => {

    btn.addEventListener("click", function(e){
      e.preventDefault();

      let filter = this.dataset.filter.toLowerCase();

      let filtered = filter === "all"
        ? allProducts
        : allProducts.filter(p => (p.category || "").toLowerCase() === filter);

      renderProducts(filtered);
    });

  });
}

/* ===============================
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", async () => {

  try {
    const products = await loadProducts();

    allProducts = products;
    renderProducts(products);
    setupFilters();
    updateCartUI();

  } catch (err) {
    console.error(err);
  }
  document.addEventListener("DOMContentLoaded", displayProducts);

});
