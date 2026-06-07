My app.js: "use strict";

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

    images: [
      p.image,
      p.image2,
      p.image3
    ].filter(Boolean)
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
   PRODUCT CARD
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
          <img src="images/${img}" onclick="swapImg('${p.id}','${img}')">
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
   CHECKOUT SYSTEM ✅
================================ */
function renderCheckout(){

  // ✅ WAIT FOR PRODUCTS
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
    const image = product.images?.[0] || "default.jpg";

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
   PAYMENT FUNCTIONS ✅
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

  // ✅ VALIDATION (CRITICAL)
  if(!name || !phoneInput){
    alert("Please fill in your Name and Phone Number before ordering ✅");
    return;
  }

  let message = `🛍️ Tinkers Order\n\n`;
  message += `Name: ${name}\n`;
  message += `Phone: ${phoneInput}\n`;
  message += `Delivery: ${delivery}\n\n`;

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

  const phone = "27720912943"; // your number

  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}
function payfastCheckout(){

  const cart = readCart();

  if(cart.length === 0){
    alert("Cart is empty ❌");
    return;
  }

  let total = 0;
  let orderItems = [];

  cart.forEach(item => {

    const product = window.__products.find(p => p.id === item.id);

    if(product){
      const subtotal = product.price * item.qty;

      total += subtotal;

      // ✅ IMPORTANT: SAVE FULL PRODUCT DATA
      orderItems.push({
        name: product.name,
        qty: item.qty,
        price: product.price,
        subtotal: subtotal
      });
    }

  });

  // ✅ SAVE COMPLETE ORDER (THIS FIXES EVERYTHING)
  const order = {
    orderID: "TK" + Date.now(),
    date: new Date().toLocaleString(),
    items: orderItems,
    total: total
  };

  localStorage.setItem("lastOrder", JSON.stringify(order));

  // ✅ PAYFAST REDIRECT
  const params = new URLSearchParams({
    merchant_id: "10000100",
    merchant_key: "46f0cd694581a",
    amount: total.toFixed(2),
    item_name: "Tinkers Order",
    return_url: "https://tinkers-sys.github.io/tinkers-live/success.html",
    cancel_url: "https://tinkers-sys.github.io/tinkers-live/cancel.html"
  });

  window.location.href =
    "https://sandbox.payfast.co.za/eng/process?" + params.toString();
}

function payflexCheckout(){

  const name = document.getElementById("custName").value.trim();
  const phoneInput = document.getElementById("custPhone").value.trim();

  // ✅ VALIDATION (CRITICAL)
  if(!name || !phoneInput){
    alert("Please fill in your Name and Phone Number before using Payflex ✅");
    return;
  }

  alert("Payflex request ✅");

  whatsappOrder(); // reuse validated function
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
   INIT ✅ FINAL
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
