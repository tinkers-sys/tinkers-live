"use strict";
const PAYMENT_MODE = "whatsapp"; // later: "payfast" or "peach"
/* ===== Paths ===== */
const BASE_PATH = location.pathname.includes("/tinkers-live/")
  ? "/tinkers-live"
  : "";

const PRODUCTS_URL = BASE_PATH + "/products.json";
const CART_KEY = "tinkers_cart_v1";

/* ===== Products ===== */
async function loadProducts() {
  try {
    const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load products.json");
    return await res.json();
  } catch (e) {
    console.error(e);
    return [];
  }
}

/* ===== Render products ===== */
function renderCart(products) {
  const cartEl = document.getElementById("cart");
  const totalEl = document.getElementById("checkoutTotal"); // matches your checkout.html
  if (!cartEl || !totalEl) return;

  const cart = readCart();

  if (!cart.length) {
    cartEl.innerHTML = "<p>Your cart is empty.</p>";
    totalEl.textContent = "R0";
    return;
  }

  // Compact grid container
  cartEl.innerHTML = `<div class="checkout-grid" id="checkoutGrid"></div>`;
  const grid = document.getElementById("checkoutGrid");

  let total = 0;

  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;

    const lineTotal = Number(product.price || 0) * Number(item.qty || 0);
    total += lineTotal;

    const card = document.createElement("div");
    card.className = "checkout-card";

    card.innerHTML = `
      <img class="checkout-thumb" src="images/${product.image}" alt="${product.name}">
      <div class="checkout-info">
        <div class="checkout-name">${product.name}</div>
        <div class="checkout-price">R${product.price}</div>

        <div class="qty-row">
          <button type="button" class="qty-btn" onclick="updateQty('${product.id}', -1)">−</button>
          <span class="qty-val">${item.qty}</span>
          <button type="button" class="qty-btn" onclick="updateQty('${product.id}', 1)">+</button>

          <button type="button" class="remove-btn" onclick="removeFromCart('${product.id}')">Remove</button>
        </div>

        <div class="checkout-line">Line total: <strong>R${lineTotal}</strong></div>
      </div>
    `;

    grid.appendChild(card);
  });

  totalEl.textContent = "R" + total;
}

/* ===== Categories ===== */
function wireCategoryLinks(products) {
  document.querySelectorAll("nav a[data-filter]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const cat = link.dataset.filter;
      renderProducts(products, cat);
    });
  });
}

/* ===== Cart ===== */
function readCart() {
  return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(id) {
  const cart = readCart();
  const product = window.__products.find(p => p.id === id);

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, qty: 1 });
  }

  writeCart(cart);

  alert(`${product ? product.name : "Product"} added to cart`);
}


function renderCart(products) {
 const cartEl = document.getElementById("cart");
cartEl.className = "checkout-grid";
 const totalEl = document.getElementById("checkoutTotal");


  if (!cartEl || !totalEl) return;

  const cart = readCart();

  if (!cart.length) {
    cartEl.innerHTML = "<p>Your cart is empty.</p>";
    totalEl.textContent = "R0";
    return;
  }

  let total = 0;
  cartEl.innerHTML = "";

  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;

    const lineTotal = product.price * item.qty;
    total += lineTotal;

    cartEl.innerHTML += `
      <div class="card">
       <img src="images/${product.image}" alt="${product.name}" />
        <h3>${product.name}</h3>
        <p>Qty: ${item.qty}</p>
        <p>R${lineTotal}</p>
      </div>
    `;
  });

  totalEl.textContent = "R" + total;
}
function clearCart() {
  localStorage.removeItem(CART_KEY);

  const cartEl = document.getElementById("cart");
  if (cartEl) {
    cartEl.innerHTML = "<p>Your cart is empty.</p>";
  }

  alert("Cart cleared");
}
function updateQty(id, delta) {
  const cart = readCart();
  const item = cart.find(x => x.id === id);
  if (!item) return;

  item.qty += delta;

  // remove if qty goes to zero
  const next = cart.filter(x => x.qty > 0);
  writeCart(next);
  renderCart(window.__products || []);
}

function removeFromCart(id) {
  const cart = readCart().filter(x => x.id !== id);
  writeCart(cart);
  renderCart(window.__products || []);
}

function payNow() {
  if (PAYMENT_MODE === "whatsapp") {
    return payNowWhatsApp();
  }
  if (PAYMENT_MODE === "payfast") {
    alert("PayFast integration coming next.");
    return;
  }
  if (PAYMENT_MODE === "peach") {
    alert("Peach Payments integration coming next.");
    return;
  }
}
  let total = 0;
  let lines = [];

  cart.forEach(item => {
    const p = (window.__products || []).find(x => x.id === item.id);
    if (!p) return;
    const lineTotal = Number(p.price || 0) * Number(item.qty || 0);
    total += lineTotal;
    lines.push(`• ${p.name}  x${item.qty}  = R${lineTotal}`);
  });

  const message =
    `🛒 Tinkers Order Summary\n\n` +
    lines.join("\n") +
    `\n\n✅ Total: R${total}\n\n` +
    `Name:\nDelivery address (if needed):\nPreferred payment method (EFT / Card):`;

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank");
}
/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", async () => {
  const products = await loadProducts();
  window.__products = products;

  if (document.getElementById("products")) {
    renderProducts(products);
    wireCategoryLinks(products);
  }

  if (document.getElementById("cart")) {
    renderCart(products);
  }
});
