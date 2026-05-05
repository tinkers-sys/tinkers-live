"use strict";

/* ========= Hosting-safe products.json path ========= */
const BASE_PATH = location.pathname.includes("/tinkers-live/") ? "/tinkers-live" : "";
const PRODUCTS_URL = BASE_PATH + "/products.json";

/* ========= Cart ========= */
const CART_KEY = "tinkers_cart_v1";

/* ========= WhatsApp ========= */
const WHATSAPP_NUMBER = "27682525454";

/* ========= Payment switch ========= */
const PAYMENT_MODE = "whatsapp"; // later: "payfast" | "peach"

/* ========= Helpers ========= */
function moneyZAR(n) {
  return "R" + Number(n || 0).toLocaleString("en-ZA");
}

function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  const count = readCart().reduce((s, i) => s + i.qty, 0);
  el.textContent = count;
}

function buildWhatsAppLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/* ========= Load products ========= */
async function loadProducts() {
  try {
    const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load products.json");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(e);
    return [];
  }
}

/* ========= Home grid ========= */
function renderProducts(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  const list =
    category === "All"
      ? products
      : products.filter(p => p.category === category);

  grid.innerHTML = list
    .map(
      p => `
      <div class="card">
        <img src="images/${p.image}" alt="${p.name}" loading="lazy">
        <h3>${p.name}</h3>
        <p class="category">${p.category || ""}</p>
        <p class="price">${moneyZAR(p.price)}</p>
        <button onclick="addToCart('${p.id}')">Add to cart</button>
      </div>
    `
    )
    .join("");
}

function wireCategoryLinks(products) {
  document
    .querySelectorAll("nav a[data-filter]")
    .forEach(link =>
      link.addEventListener("click", e => {
        e.preventDefault();
        renderProducts(products, link.dataset.filter);
      })
    );
}

/* ========= Cart actions ========= */
function addToCart(id) {
  const cart = readCart();
  const item = cart.find(x => x.id === id);
  item ? item.qty++ : cart.push({ id, qty: 1 });
  writeCart(cart);
  updateCartCount();

  const p = window.__products.find(x => x.id === id);
  alert(`${p ? p.name : "Product"} added to cart`);
}

function updateQty(id, delta) {
  const cart = readCart();
  const item = cart.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  writeCart(cart.filter(x => x.qty > 0));
  updateCartCount();
  renderCheckout(window.__products);
}

function removeFromCart(id) {
  writeCart(readCart().filter(x => x.id !== id));
  updateCartCount();
  renderCheckout(window.__products);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartCount();
  renderCheckout(window.__products);
  alert("Cart cleared");
}

/* ========= Checkout ========= */
function renderCheckout(products) {
  const cartEl = document.getElementById("cart");
  const totalEl = document.getElementById("checkoutTotal");
  if (!cartEl || !totalEl) return;

  const cart = readCart();
  if (!cart.length) {
    cartEl.innerHTML = "<p>Your cart is empty.</p>";
    totalEl.textContent = "R0";
    return;
  }

  let total = 0;
  cartEl.innerHTML = '<div class="checkout-grid"></div>';
  const grid = cartEl.firstElementChild;

  cart.forEach(item => {
    const p = products.find(x => x.id === item.id);
    if (!p) return;
    const line = p.price * item.qty;
    total += line;

    grid.innerHTML += `
      <div class="checkout-card">
        <img class="checkout-thumb" src="images/${p.image}">
        <div class="checkout-info">
          <div class="checkout-name">${p.name}</div>
          <div class="checkout-price">${moneyZAR(p.price)}</div>

          <div class="qty-row">
            <button onclick="updateQty('${p.id}',-1)">−</button>
            <span>${item.qty}</span>
            <button onclick="updateQty('${p.id}',1)">+</button>
            <button class="remove-btn" onclick="removeFromCart('${p.id}')">Remove</button>
          </div>

          <div class="checkout-line">
            Line: <strong>${moneyZAR(line)}</strong>
          </div>
        </div>
      </div>
    `;
  });

  totalEl.textContent = moneyZAR(total);
}

/* ========= Pay Now ========= */
function payNow() {
  if (PAYMENT_MODE !== "whatsapp") return alert("Payment gateway coming next.");

  const cart = readCart();
  if (!cart.length) return alert("Your cart is empty");

  let total = 0;
  const lines = cart.map(i => {
    const p = window.__products.find(x => x.id === i.id);
    const line = p.price * i.qty;
    total += line;
    return `• ${p.name} x${i.qty} = ${moneyZAR(line)}`;
  });

  const msg =
    "🛒 TINKERS ORDER SUMMARY\n\n" +
    lines.join("\n") +
    `\n\nTOTAL: ${moneyZAR(total)}\n\nName:\nDelivery address:\nPayment method:`;

  window.open(buildWhatsAppLink(msg), "_blank");
}

/* ========= Init ========= */
document.addEventListener("DOMContentLoaded", async () => {
  const products = await loadProducts();
  window.__products = products;

  updateCartCount();

  if (document.getElementById("products")) {
    renderProducts(products, "All");
    wireCategoryLinks(products);
  }

  if (document.getElementById("cart")) {
    renderCheckout(products);
  }
});
