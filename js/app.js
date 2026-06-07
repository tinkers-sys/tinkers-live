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
    category: (p.category || "").toLowerCase(),
    price: Number(p.price),

    // ✅ ONLY ONE IMAGE NOW
    image: p.image
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
   PRODUCT CARD ✅ CLEAN
================================ */
function buildCard(p) {

  return `
    <div class="product-card">

      <img src="images/${p.image}" alt="${p.name}">

      <h3 class="product-title">${p.name}</h3>
      <p class="product-price">R${p.price}</p>

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

      // ✅ active UI highlight
      document.querySelectorAll(".filters a").forEach(b => b.classList.remove("active"));
      this.classList.add("active");

      const category = this.dataset.filter;

      const filtered =
        category === "all"
          ? products
          : products.filter(p => p.category === category);

      render("products", filtered);
    });
  });

}


/* ===============================
   CHECKOUT SYSTEM ✅
================================ */
function renderCheckout(){

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
    if(!product) return;

    const price = product.price;
    const name = product.name;
    const image = product.image;

    const subtotal = price * item.qty;
    total += subtotal;

    grid.innerHTML += `
      <div class="checkout-card">

        <img src="images/${image}">

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
function whatsappOrder(){

  const cart = readCart();

  if(cart.length === 0){
    alert("Cart is empty ❌");
    return;
  }

  const name = document.getElementById("custName").value.trim();
  const phoneInput = document.getElementById("custPhone").value.trim();
  const delivery = document.getElementById("deliveryOption").value;

  if(!name || !phoneInput){
    alert("Fill in your Name and Phone Number ✅");
    return;
  }

  let message = `🛍️ Tinkers Order\n\nName: ${name}\nPhone: ${phoneInput}\nDelivery: ${delivery}\n\n`;

  let total = 0;

  cart.forEach(item => {
    const product = window.__products.find(p => p.id === item.id);
    if(product){
      const subtotal = product.price * item.qty;
      total += subtotal;
      message += `• ${product.name} x${item.qty} - R${subtotal}\n`;
    }
  });

  message += `\nTotal: R${total}`;

  const phone = "27720912943";

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
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
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();
  window.__products = products;

  updateCartCount();

  if(document.getElementById("products")){
    render("products", products);
    setupFilters(products);
  }

  renderCheckout();
});
