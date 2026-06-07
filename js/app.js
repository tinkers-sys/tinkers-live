"use strict";

const URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";

/* ===============================
   CART SYSTEM
================================ */
function readCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function writeCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;

  const total = readCart().reduce((sum, item) => sum + item.qty, 0);
  el.textContent = total;
}

/* ===============================
   LOAD PRODUCTS (UPDATED)
================================ */
async function loadProducts() {
  const res = await fetch(URL);
  const data = await res.json();

  return data.map(p => ({
    id: String(p.id || p.ID),
    name: p.name,
    category: (p.category || "").toLowerCase(),
    price: Number(p.price),

    // ✅ MULTI IMAGE SUPPORT
    images: [
      p.image,
      p.image2,
      p.image3
    ].filter(Boolean) // removes empty values
  }));
}

/* ===============================
   ADD TO CART
================================ */
function addToCart(id) {
  let cart = readCart();

  const item = cart.find(i => i.id === id);

  if (item) item.qty++;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  updateCartCount();
}

/* ===============================
   IMAGE SWITCH
================================ */
function swapImg(id, src){
  const img = document.getElementById(`img-${id}`);
  if(img){
    img.src = `images/${src}`;
  }
}

/* ===============================
   PRODUCT CARD (GALLERY ✅)
================================ */
function buildCard(p) {

  const mainImage = p.images[0];

  return `
    <div class="card">

      <img 
        id="img-${p.id}"
        src="images/${mainImage}"
        alt="${p.name}"

        onmouseover="${p.images[1] ? `this.src='images/${p.images[1]}'` : ''}"
        onmouseout="this.src='images/${mainImage}'"
      >

      <div class="thumbs">
        ${p.images.map(img => `
          <img 
            src="images/${img}" 
            onclick="swapImg('${p.id}','${img}')"
          >
        `).join("")}
      </div>

      <h3>${p.name}</h3>
      <p>R${p.price}</p>

      <button class="add-btn" data-id="${p.id}">
        Add to cart
      </button>

    </div>
  `;
}

/* ===============================
   RENDER
================================ */
function render(id, products) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = products.map(buildCard).join("");
}

/* ===============================
   FILTERS
================================ */
function setupFilters(products){

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", function(e){
      e.preventDefault();

      const category = this.dataset.filter.toLowerCase();

      const filtered =
        category === "all"
          ? products
          : products.filter(p => p.category.includes(category));

      render("products", filtered);
    });
  });

}

/* ===============================
   CLICK HANDLER
================================ */
document.addEventListener("click", function(e){
  if (e.target.classList.contains("add-btn")) {
    addToCart(e.target.dataset.id);
  }
});
/* ===============================
   CHECKOUT RENDER (FINAL FIX ✅)
================================ */
function renderCheckout(){

  // ✅ WAIT UNTIL PRODUCTS ARE LOADED
  if(!window.__products || window.__products.length === 0){
    setTimeout(renderCheckout, 200);
    return;
  }

  const cartEl = document.getElementById("cart");
  const totalEl = document.getElementById("checkoutTotal");

  if(!cartEl || !totalEl) return;

  const cart = readCart();

  cartEl.innerHTML = '<div class="checkout-grid"></div>';
  const grid = cartEl.querySelector(".checkout-grid");

  if(!cart.length){
    grid.innerHTML = "<p>Your cart is empty</p>";
    totalEl.textContent = "R0";
    return;
  }

  let total = 0;

  cart.forEach(item => {

    const product = window.__products.find(p => p.id === item.id);

    if(!product){
      console.warn("Missing product:", item.id);
      return;
    }

    const price = product.price || 0;
    const name = product.name || "Unknown Product";
    const image = product.images?.[0] || "default.jpg";

    const subtotal = price * item.qty;
    total += subtotal;

    grid.innerHTML += `
      <div class="checkout-card">

        <img src="images/${image}" alt="${name}">

        <h3>${name}</h3>

        <p>${item.qty} × R${price}</p>
        <p><strong>R${subtotal}</strong></p>

        <div class="qty-controls">
          <button onclick="updateQty('${item.id}', -1)">-</button>
          <button onclick="updateQty('${item.id}', 1)">+</button>
        </div>

        <button onclick="removeItem('${item.id}')">Remove</button>

      </div>
    `;
  });

  totalEl.textContent = "R" + total;
}
function updateQty(id, change){
  let cart = readCart();

  let item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += change;

  if (item.qty <= 0){
    cart = cart.filter(i => i.id !== id);
  }

  writeCart(cart);
  renderCheckout();
  updateCartCount();
}

function removeItem(id){
  let cart = readCart().filter(i => i.id !== id);
  writeCart(cart);
  renderCheckout();
  updateCartCount();
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  // ✅ LOAD PRODUCTS FIRST (VERY IMPORTANT)
  const products = await loadProducts();
  window.__products = products;

  // ✅ UPDATE CART COUNT
  updateCartCount();

  // ✅ RENDER STORE IF EXISTS
  render("products", products);

  // ✅ FILTERS
  setupFilters(products);

  // ✅ ✅ ALWAYS RENDER CHECKOUT (FIX)
  renderCheckout();
});
