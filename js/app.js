"use strict";

/* ========= Hosting-safe products.json path =========
   GitHub Pages: /tinkers-live/products.json
   Root hosts:   /products.json
*/
const BASE_PATH = location.pathname.includes("/tinkers-live/") ? "/tinkers-live" : "";
const PRODUCTS_URL = BASE_PATH + "/products.json";

/* ========= Cart ========= */
const CART_KEY = "tinkers_cart_v1";

/* ========= WhatsApp ========= */
const WHATSAPP_NUMBER = "27682525454";

/* ========= Payment switch (do later one-at-a-time) ========= */
const PAYMENT_MODE = "whatsapp"; // later: "payfast" or "peach"

/* ========= Helpers ========= */
function moneyZAR(n) {
  const v = Number(n || 0);
  return "R" + v.toLocaleString("en-ZA");
}
function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}
function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function buildWhatsAppLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/* ========= Load products ========= */
async function loadProducts() {
  try {
    const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load products.json");
    const data = await res.json();
    return Array.isArray(data) ? data : (data.products || []);
  } catch (e) {
    console.error(e);
    return [];
  }
}

/* ========= Render: Home products grid ========= */
function renderProducts(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  const filtered = category === "All" ? products : products.filter(p => p.category === category);

  grid.innerHTML = filtered.map(p => `
    <div class="card">
      <img src="images/${p.image}" alt="${p.name}" loading="lazy">
      <h3>${p.name}</h3>
      <p class="category">${p.category || ""}</p>
      <p class="price">${moneyZAR(p.price)}</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button type="button" onclick="addToCart('${p.id}')">Add to cart</button>
      </div>
    </div>
  `).join("");
}

function wireCategoryLinks(products) {
  document.querySelectorAll("nav a[data-filter]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const cat = link.dataset.filter || "All";
      renderProducts(products, cat);
    });
  });
}

/* ========= Cart actions ========= */
function addToCart(id) {
  const cart = readCart();
  const item = cart.find(x => x.id === id);
  if (item) item.qty += 1;
  else cart.push({ id, qty: 1 });

  writeCart(cart);

  const p = (window.__products || []).find(x => x.id === id);
  alert(`${p ? p.name : "Product"} added to cart`);
}

function updateQty(id, delta) {
  const cart = readCart();
  const item = cart.find(x => x.id === id);
  if (!item) return;

  item.qty += delta;

  const next = cart.filter(x => x.qty > 0);
  writeCart(next);

  renderCheckout(window.__products || []);
}

function removeFromCart(id) {
  const next = readCart().filter(x => x.id !== id);
  writeCart(next);
  renderCheckout(window.__products || []);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  renderCheckout(window.__products || []);
  alert("Cart cleared");
}

/* ========= Checkout render (small grid + total) ========= */
function renderCheckout(products) {
  const cartEl = document.getElementById("cart");
  const totalEl = document.getElementById("checkoutTotal");
  if (!cartEl || !totalEl) return;

  const cart = readCart();
  if (!cart.length) {
    cartEl.innerHTML = `<p>Your cart is empty.</p>`;
    totalEl.textContent = "R0";
    return;
  }

  let total = 0;

  cartEl.innerHTML = `<div class="checkout-grid"></div>`;
  const grid = cartEl.querySelector(".checkout-grid");

  cart.forEach(line => {
    const p = products.find(x => x.id === line.id);
    if (!p) return;

    const lineTotal = Number(p.price || 0) * Number(line.qty || 0);
    total += lineTotal;

    const div = document.createElement("div");
    div.className = "checkout-card";
    div.innerHTML = `
      <img class="checkout-thumb" src="images/${p.image}" alt="${p.name}" loading="lazy">
      <div class="checkout-info">
        <div class="checkout-name">${p.name}</div>
        <div class="checkout-price">${moneyZAR(p.price)}</div>

        <div class="qty-row">
          <button type="button" class="qty-btn" onclick="updateQty('${p.id}', -1)">−</button>
          <span class="qty-val">${line.qty}</span>
          <button type="button" class="qty-btn" onclick="updateQty('${p.id}', 1)">+</button>

          <button type="button" class="remove-btn" onclick="removeFromCart('${p.id}')">Remove</button>
        </div>

        <div class="checkout-line">Line total: <strong>${moneyZAR(lineTotal)}</strong></div>
      </div>
    `;
    grid.appendChild(div);
  });

  totalEl.textContent = moneyZAR(total);
}

/* ========= Pay Now (WhatsApp now; PayFast/Peach later) ========= */
function payNow() {
  if (PAYMENT_MODE === "whatsapp") return payNowWhatsApp();
  if (PAYMENT_MODE === "payfast") return alert("PayFast integration coming next.");
  if (PAYMENT_MODE === "peach") return alert("Peach Payments integration coming next.");
}

function payNowWhatsApp() {
  const cart = readCart();
  if (!cart.length) {
    alert("Your cart is empty");
    return;
  }

  let total = 0;
  const lines = [];

  cart.forEach(item => {
    const p = (window.__products || []).find(x => x.id === item.id);
    if (!p) return;
    const lineTotal = Number(p.price || 0) * Number(item.qty || 0);
    total += lineTotal;
    lines.push(`• ${p.name}  x${item.qty}  = ${moneyZAR(lineTotal)}`);
  });

  const message =
    `🛒 Tinkers Order Summary\n\n` +
    lines.join("\n") +
    `\n\n✅ Total: ${moneyZAR(total)}\n\n` +
    `Name:\nDelivery address (if needed):\nPreferred payment method (EFT / Card):`;

  window.open(buildWhatsAppLink(message), "_blank", "noopener");
}

/* ========= Init ========= */
document.addEventListener("DOMContentLoaded", async () => {
  const products = await loadProducts();
  window.__products = products;

  // Home page
  if (document.getElementById("products")) {
    renderProducts(products, "All");
    wireCategoryLinks(products);
  }

  // Checkout page
  if (document.getElementById("cart")) {
    renderCheckout(products);
  }
});
