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

  const cart = readCart();

  if(cart.length === 0){
    alert("Cart is empty ❌");
    return;
  }

  let total = 0;
  let itemName = "Tinkers Order";

  cart.forEach(item => {
    const product = window.__products.find(p => p.id === item.id);
    if(product){
      total += product.price * item.qty;
    }
  });

  // ✅ PAYFAST SANDBOX (TESTING MODE)
const payfastURL = "https://sandbox.payfast.co.za/eng/process";

const params = new URLSearchParams({
  merchant_id: "10000100",
  merchant_key: "46f0cd694581a",

  amount: total.toFixed(2),
  item_name: itemName,

  return_url: "https://tinkers-sys.github.io/tinkers-live/success.html",
  cancel_url: "https://tinkers-sys.github.io/tinkers-live/cancel.html",

  // ✅ OPTIONAL (safe placeholder)
  notify_url: "https://tinkers-sys.github.io/"
});

  // ✅ REDIRECT TO PAYFAST
  window.location.href = payfastURL + "?" + params.toString();
}


function payflexCheckout(){

  const cart = readCart();

  if(cart.length === 0){
    alert("Cart is empty ❌");
    return;
  }

  const name = document.getElementById("custName").value.trim();
  const phoneInput = document.getElementById("custPhone").value.trim();

  if(!name || !phoneInput){
    alert("Please enter your details ✅");
    return;
  }

  let message = "💳 Payflex Order Request\n\n";
  message += `Name: ${name}\nPhone: ${phoneInput}\n\n`;

  let total = 0;

  cart.forEach(item => {
    const product = window.__products.find(p => p.id === item.id);

    if(product){
      const subtotal = product.price * item.qty;
      total += subtotal;

      message += `${product.name} x${item.qty} - R${subtotal}\n`;
    }
  });

  message += `\nTotal: R${total}`;
  message += "\n\nPlease send Payflex payment link ✅";

  const phone = "27720912943"; // your number

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");

  // ✅ THIS WAS MISSING
  clearCart();
}

function whatsappOrder(){

  const cart = readCart();

  if(cart.length === 0){
    alert("Cart is empty ❌");
    return;
  }

  // ✅ GET CUSTOMER INFO
  const name = document.getElementById("custName").value.trim();
  const phoneInput = document.getElementById("custPhone").value.trim();
  const delivery = document.getElementById("deliveryOption").value;

  if(!name || !phoneInput){
    alert("Please enter your name and phone number ✅");
    return;
  }

  let message = `🛍️ Tinkers Order Request\n\n`;
  message += `👤 Name: ${name}\n`;
  message += `📞 Phone: ${phoneInput}\n`;
  message += `🚚 Delivery: ${delivery}\n\n`;

  let total = 0;

  message += `🧾 Order Details:\n`;

  cart.forEach(item => {
    const product = window.__products.find(p => p.id === item.id);
    if(product){
      const subtotal = product.price * item.qty;
      total += subtotal;

      message += `• ${product.name} x${item.qty} - R${subtotal}\n`;
    }
  });

  message += `\n💰 Total: R${total}\n`;
  message += `\nPlease confirm availability ✅`;

  // ✅ IMPORTANT: USE YOUR NUMBER
  const phone = "27720912943"; // <-- REPLACE WITH YOUR REAL NUMBER

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");

  // ✅ OPTIONAL: clear cart after sending
  clearCart();
}
/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  // ✅ FORCE CLEAR CART AFTER PAYFAST SUCCESS
  if(window.location.href.includes("success.html")){
    localStorage.removeItem("cart");
  }

  const products = await loadProducts();
  window.__products = products;

  updateCartCount();

  render("featuredProducts", products.slice(0,4));
  render("trendingProducts", products.slice(4,10));
  render("products", products);

  setupFilters(products);

  renderCheckout();
});
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
