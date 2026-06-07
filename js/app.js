"use strict";

let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* LOAD */
async function loadProducts() {
  const res = await fetch("https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1");
  const data = await res.json();

  return data.map(p => ({
    name: p.name || "Unknown",
    price: Number(p.price) || 0,
    image: p.image || "default.jpg",
    category: (p.category || "").toLowerCase()
  }));
}

/* CARD */
function buildCard(p) {
  return `
    <div class="product-card">
      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p>R${p.price}</p>

      <button class="add-btn"
        onclick="addToCart('${p.name}', ${p.price}, '${p.image}')">
        Add to cart
      </button>
    </div>
  `;
}

/* ADD */
function addToCart(name, price, image) {
  let item = cart.find(i => i.name === name);

  if (item) item.qty++;
  else cart.push({ name, price, image, qty: 1 });

  saveCart();
}

/* SAVE */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

/* CART DISPLAY */
function updateCart() {

  const el = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!el) return;

  el.innerHTML = "";
  let total = 0;

  cart.forEach(item => {

    const subtotal = item.price * item.qty;
    total += subtotal;

    el.innerHTML += `
      <div class="cart-item">

        <span>${item.name}</span>

        <div class="qty-controls">
          <button onclick="changeQty('${item.name}',1)">+</button>
          <button onclick="changeQty('${item.name}',-1)">-</button>
        </div>

        <span>R${subtotal}</span>
      </div>
    `;
  });

  totalEl.textContent = total;
}

/* CHANGE QTY */
function changeQty(name, amt) {
  let item = cart.find(i => i.name === name);
  if (!item) return;

  item.qty += amt;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.name !== name);
  }

  saveCart();
}

/* FILTERS */
function setupFilters(products) {
  document.querySelectorAll(".filters a").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();

      const f = btn.dataset.filter;

      const filtered =
        f === "all"
          ? products
          : products.filter(p => p.category === f);

      document.getElementById("products").innerHTML =
        filtered.map(buildCard).join("");
    });
  });
}

/* DRAWER */
function toggleCart() {
  document.getElementById("cartDrawer").classList.toggle("open");
}

function clearCart() {
  cart = [];
  saveCart();
}

/* CHECKOUT */
function renderCheckout() {

  const grid = document.getElementById("checkoutGrid");
  const totalEl = document.getElementById("checkoutTotal");

  if (!grid) return;

  grid.innerHTML = "";
  let total = 0;

  cart.forEach(item => {

    const subtotal = item.price * item.qty;
    total += subtotal;

    grid.innerHTML += `
      <div class="product-card">
        <img src="images/${item.image}">
        <h3>${item.name}</h3>

        <p>${item.qty} x R${item.price}</p>

        <div class="qty-controls">
          <button onclick="changeQty('${item.name}',1)">+</button>
          <button onclick="changeQty('${item.name}',-1)">-</button>
        </div>

        <strong>R${subtotal}</strong>
      </div>
    `;
  });

  totalEl.textContent = total;
}

/* PAYMENTS */
function whatsappOrder() {
  let msg = "Tinkers Order\n";
  let total = 0;

  cart.forEach(i => {
    let sub = i.price * i.qty;
    total += sub;
    msg += `${i.name} x${i.qty} - R${sub}\n`;
  });

  msg += `Total: R${total}`;

  window.open("https://wa.me/27720912943?text=" + encodeURIComponent(msg));
}

function payfastCheckout() {
  let total = 0;
  cart.forEach(i => total += i.price * i.qty);

  const params = new URLSearchParams({
    merchant_id: "10000100",
    merchant_key: "46f0cd694581a",
    amount: total.toFixed(2),
    item_name: "Tinkers Order"
  });

  window.location.href =
    "https://sandbox.payfast.co.za/eng/process?" + params.toString();
}

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {

  if (window.location.pathname.includes("checkout")) {
    renderCheckout();
    return;
  }

  const products = await loadProducts();

  document.getElementById("products").innerHTML =
    products.map(buildCard).join("");

  setupFilters(products);
  updateCart();
});
