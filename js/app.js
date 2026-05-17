"use strict";

/* ===============================
   CONFIG
================================ */
const PRODUCTS_URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";
const CART_KEY = "tinkers_cart_v1";
const SOLD_KEY = "tinkers_sold";

// ✅ PUT YOUR SCRIPT URL HERE
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby3ZleL6269FAtILm43fwUz6mDB-XpzZwmizsTNFkpkYW6hxdYugiPS-uDE_gRmkrB-/exec";

/* ===============================
   HELPERS
================================ */
function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function clearCart() {
  if (!confirm("Clear cart?")) return;

  localStorage.removeItem(CART_KEY);
  updateCartCount();
  renderCheckout();
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;

  const totalQty = readCart().reduce((s, i) => s + i.qty, 0);
  el.textContent = totalQty;
}

function money(n) {
  return "R" + Number(n || 0).toLocaleString("en-ZA");
}

/* ===============================
   PRODUCTS
================================ */
async function loadProducts() {
  const res = await fetch(PRODUCTS_URL);
  const data = await res.json();

  window.__products = data.map(p => ({
    ...p,
    price: Number(p.price),
    stock: Number(p.stock)
  }));
}

function renderProducts(list = window.__products) {
  const el = document.getElementById("products");
  if (!el) return;

  el.innerHTML = list.map(p => {
    let badge = "";
    let btn = `<button onclick="addToCart('${p.id}')">Add to cart</button>`;

    if (p.stock <= 0) {
      badge = `<div class="badge">OUT</div>`;
      btn = `<button disabled>Out of stock</button>`;
    } else if (p.stock === 1) {
      badge = `<div class="badge">LAST ITEM</div>`;
      btn = `<button onclick="whatsappProduct('${p.name}')">Reserve</button>`;
    } else if (p.stock <= 3) {
      badge = `<div class="badge">LOW STOCK</div>`;
    }

    return `
      <div class="card">
        ${badge}
        <img src="images/${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>${money(p.price)}</p>
        ${btn}
      </div>
    `;
  }).join("");
}

/* ===============================
   CART
================================ */
function addToCart(id) {
  const cart = readCart();
  const existing = cart.find(i => i.id === id);

  if (existing) existing.qty++;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  updateCartCount();
  alert("Added to cart");
}

function renderCheckout() {
  const cartEl = document.getElementById("cart");
  const totalEl = document.getElementById("checkoutTotal");
  if (!cartEl || !totalEl) return;

  const cart = readCart();

  if (!cart.length) {
    cartEl.innerHTML = "<p>Your cart is empty</p>";
    totalEl.textContent = "R0";
    return;
  }

  let total = 0;

  cartEl.innerHTML = `
    <div class="checkout-grid"></div>
  `;

  const grid = cartEl.querySelector(".checkout-grid");

  cart.forEach(item => {
    const p = window.__products.find(x => x.id === item.id);
    if (!p) return;

    const lineTotal = p.price * item.qty;
    total += lineTotal;

    grid.innerHTML += `
      <div class="checkout-card">
        <img src="images/${p.image}">
        <div>
          <strong>${p.name}</strong>
          <p>${money(lineTotal)}</p>
          <button onclick="removeFromCart('${p.id}')">Remove</button>
        </div>
      </div>
    `;
  });

  totalEl.textContent = money(total);
}

function removeFromCart(id) {
  const cart = readCart().filter(i => i.id !== id);
  writeCart(cart);
  updateCartCount();
  renderCheckout();
}

/* ===============================
   WHATSAPP PRODUCT
================================ */
function whatsappProduct(name) {
  window.open(
    `https://wa.me/27682525454?text=${encodeURIComponent("Hi, I want " + name)}`,
    "_blank"
  );
}

/* ===============================
   WHATSAPP CART (FIXED ✅)
================================ */
function whatsappCart() {

  const cart = readCart();
  if (!cart.length) {
    alert("Cart empty");
    return;
  }

  let message = "Hi Tinkers, I would like to order:\n\n";
  let total = 0;

  cart.forEach(item => {
    const p = window.__products.find(x => x.id === item.id);
    if (!p) return;

    const lineTotal = p.price * item.qty;
    total += lineTotal;

    message += `• ${p.name} x${item.qty} - R${lineTotal}\n`;

    // ✅ SEND TO GOOGLE SHEET (FIXED)
    fetch(`${SCRIPT_URL}?product=${encodeURIComponent(p.name)}&qty=${item.qty}&total=${lineTotal}`);
  });

  message += `\nTotal: R${total}`;

  window.open(
    `https://wa.me/27682525454?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

/* ===============================
   PAYFAST
================================ */
function payNow() {
  const cart = readCart();
  if (!cart.length) {
    alert("Cart empty");
    return;
  }

  let total = 0;
  let items = [];

  cart.forEach(item => {
    const p = window.__products.find(x => x.id === item.id);
    if (!p) return;

    total += p.price * item.qty;
    items.push(`${p.name} x${item.qty}`);
  });

  document.getElementById("pf_amount").value = total.toFixed(2);
  document.getElementById("pf_item_name").value = items.join(", ");

  document.getElementById("payfastForm").submit();
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {
  await loadProducts();
  renderProducts();
  updateCartCount();
  renderCheckout();
});
