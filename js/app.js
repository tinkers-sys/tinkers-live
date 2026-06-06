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
   LOAD PRODUCTS
================================ */
async function loadProducts() {
  const res = await fetch(URL);
  const data = await res.json();

  return data.map(p => ({
    id: String(p.id || p.ID),
    name: p.name,
    category: (p.category || "").trim().toLowerCase(),
    image: p.image,
    price: Number(p.price)
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
   PRODUCT CARD
================================ */
function buildCard(p) {
  return `
    <div class="card">
      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p>R${p.price}</p>
      <button class="add-btn" data-id="${p.id}">Add to cart</button>
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
   ✅ FILTER (FINAL FIXED)
================================ */
function setupFilters(products){

  const featured = document.querySelector(".featured");
  const trending = document.querySelector(".trending");

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", function(e){
      e.preventDefault();

      const selected = this.dataset.filter.toLowerCase().trim();

      let filtered;

      if(selected === "all"){
        filtered = products;

        featured.style.display = "block";
        trending.style.display = "block";

      } else {
        filtered = products.filter(p => p.category.includes(selected));

        featured.style.display = "none";
        trending.style.display = "none";
      }

      render("products", filtered);

      const title = document.getElementById("sectionTitle");
      if(title){
        title.innerText =
          selected === "all"
            ? "Our Collection"
            : "Showing: " + this.dataset.filter;
      }

      document.getElementById("products")
        .scrollIntoView({ behavior: "smooth" });
    });
  });
}

/* ===============================
   CLICK HANDLER
================================ */
document.addEventListener("click", function(e){
  if(e.target.classList.contains("add-btn")){
    addToCart(e.target.dataset.id);
  }
});

/* ===============================
   CHECKOUT RENDER
================================ */
function renderCheckout(){

  const cartEl = document.getElementById("cart");
  const totalEl = document.getElementById("checkoutTotal");

  if (!cartEl || !totalEl) return;

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
    if(!product) return;

    const subtotal = product.price * item.qty;
    total += subtotal;

    grid.innerHTML += `
      <div class="checkout-card">
        <img src="images/${product.image}">
        <h3>${product.name}</h3>

        <p>${item.qty} × R${product.price}</p>
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

/* ===============================
   CART CONTROLS
================================ */
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

function clearCart(){
  localStorage.removeItem("cart");
  renderCheckout();
  updateCartCount();
}

/* ===============================
   PAYMENT FUNCTIONS
================================ */
function payfastCheckout(){
  alert("Redirecting to PayFast (demo) ✅");
}

function payflexCheckout(){
  alert("Payflex option selected ✅");
}

function whatsappOrder(){
  alert("WhatsApp order coming ✅");
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();

  window.__products = products;

  updateCartCount();

  render("featuredProducts", products.slice(0,4));
  render("trendingProducts", products.slice(4,10));
  render("products", products);

  setupFilters(products);

  renderCheckout();
});
