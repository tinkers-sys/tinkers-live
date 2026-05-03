"use strict";

/* Tinkers — app.js (GitHub Pages + Cloudflare Pages friendly)
   Uses: products.json (your current schema)
   Renders:
   - Home: Featured original artwork + retail grid
   - Product page: product.html?id=...
   - Cart + checkout (only if elements exist)
*/

const PRODUCTS_URL = "./products.json";
const CART_KEY = "tinkers_cart_v1";

// ✅ Put your WhatsApp number here (country code + number, no spaces)
const WHATSAPP_NUMBER = "27682525454";

/* ---------- Helpers ---------- */
function moneyZAR(value) {
  const n = Number(value || 0);
  return "R" + n.toLocaleString("en-ZA");
}

function buildWhatsAppLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Supports:
// - "images/abc.jpg" (already a path)
// - "products/abc.jpg" (will become images/products/abc.jpg)
// - "abc.jpg" (will try images/abc.jpg first, then images/products/abc.jpg)
function getImagePath(p) {
  const img = p && (p.image || p.filename);
  if (!img) return "";

  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith("images/")) return img;

  if (img.includes("/")) return "images/" + img;

  // filename-only: prefer images/<file> (your current pattern),
  // with an automatic fallback handled in the img tag.
  return "images/" + img;
}

// filename-only fallback to images/products/<file>
function getImageFallback(p) {
  const img = p && (p.image || p.filename);
  if (!img) return "";
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith("images/")) return img;
  if (img.includes("/")) return "images/" + img;
  return "images/products/" + img;
}

function productImgTag(p) {
  const src = getImagePath(p);
  if (!src) return `<div class="img-missing">No image</div>`;

  return `<img src="${src}" alt="${escapeHtml(p.name)}" loading="lazy">`;
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ---------- Cart (localStorage) ---------- */
function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;
  const count = readCart().reduce((sum, x) => sum + x.qty, 0);
  el.textContent = String(count);
}

function addToCart(id) {
  const cart = readCart();
  const found = cart.find((x) => x.id === id);
  if (found) found.qty += 1;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  updateCartCount();
  renderCartPanel(window.__products || []);
}

function updateQty(id, delta) {
  let cart = readCart();
  cart = cart
    .map((x) => (x.id === id ? { ...x, qty: x.qty + delta } : x))
    .filter((x) => x.qty > 0);

  writeCart(cart);
  updateCartCount();
  renderCartPanel(window.__products || []);
  renderCheckout(window.__products || []);
}

/* ---------- Data ---------- */
async function loadProducts() {
  const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load products.json");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.products || []);
}

/* ---------- Nav filtering ---------- */
function wireNavFilters(products) {
  const links = document.querySelectorAll("nav a[data-filter]");
  if (!links.length) return;

  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const cat = link.getAttribute("data-filter") || "All";
      renderHome(products, cat);
    });
  });
}

/* ---------- Homepage renderer ---------- */
/*
  Requires:
    - <section id="originalArt"> (optional)
    - <section id="products"></section>
*/
function renderHome(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  // Featured original artwork
  const originals = products.filter((p) => (p.type || "").toLowerCase() === "original");
  const featured = document.getElementById("originalArt");

  if (featured && originals.length) {
    const p = originals[0];
    featured.style.display = "block";

    const badge = p.signed ? "Original · Signed" : "Original Artwork";

    featured.innerHTML = `
      <div class="featured-art-inner">
        <div class="featured-art-image">
          ${productImgTag(p)}
        </div>
        <div>
          <span class="art-badge">${escapeHtml(badge)}</span>
          <h2>${escapeHtml(p.name)}</h2>
          <p class="artist">By ${escapeHtml(p.artist || "Artist")}</p>

          <div class="art-meta">
            ${p.medium ? `<span>Medium: ${escapeHtml(p.medium)}</span>` : ""}
            ${p.edition ? `<span>Edition: ${escapeHtml(p.edition)}</span>` : ""}
          </div>

          <div class="art-price">${moneyZAR(p.price)}</div>

          <div style="display:flex; gap:10px; flex-wrap:wrap;">
            <a class="primary-btn" href="product.html?id=${encodeURIComponent(p.id)}">View Artwork Details</a>
            <a class="secondary-btn" target="_blank" rel="noopener"
               href="${buildWhatsAppLink(`Hi, I'm interested in ${p.name}. Please share more details.`)}">
              Enquire on WhatsApp
            </a>
          </div>
        </div>
      </div>
    `;
  } else if (featured) {
    featured.style.display = "none";
    featured.innerHTML = "";
  }

  // Retail products (everything except originals)
  const retail = products.filter((p) => (p.type || "").toLowerCase() !== "original");
  const filtered = category === "All" ? retail : retail.filter((p) => p.category === category);

  grid.innerHTML = filtered
    .map((p) => {
      const safeId = String(p.id || "").replace(/'/g, "\\'");
      return `
        <div class="card">
          ${productImgTag(p)}
          <h3>${escapeHtml(p.name)}</h3>
          <p class="category">${escapeHtml(p.category || "")}</p>
          <p class="price">${moneyZAR(p.price)}</p>

          <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <a class="secondary-btn" href="product.html?id=${encodeURIComponent(p.id)}">View</a>
            <button type="button" onclick="addToCart('${safeId}')">Add to cart</button>
            <a class="secondary-btn" target="_blank" rel="noopener"
               href="${buildWhatsAppLink(`Hi, I'm interested in ${p.name}. Is it available and can you deliver?`)}">
              WhatsApp
            </a>
          </div>
        </div>
      `;
    })
    .join("");
}

/* ---------- Product detail page ---------- */
/*
  Requires:
    - <div id="detailRoot"></div>
*/
function renderProductDetail(products) {
  const root = document.getElementById("detailRoot");
  if (!root) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const p = products.find((x) => String(x.id) === String(id));

  if (!p) {
    root.innerHTML = `<div class="card">Product not found.</div>`;
    return;
  }

  const isOriginal = (p.type || "").toLowerCase() === "original";
  const safeId = String(p.id || "").replace(/'/g, "\\'");

  root.innerHTML = `
    <section>
      <div style="max-width:720px;margin:0 auto;">
        ${productImgTag(p)}
      </div>

      <h1>${escapeHtml(p.name)}</h1>
      <p class="category">${escapeHtml(p.category || "")}${isOriginal && p.artist ? " · " + escapeHtml(p.artist) : ""}</p>
      <p class="price">${moneyZAR(p.price)}</p>

      ${
        isOriginal
          ? `
        <p>
          ${p.medium ? `<strong>Medium:</strong> ${escapeHtml(p.medium)}<br>` : ""}
          ${p.edition ? `<strong>Edition:</strong> ${escapeHtml(p.edition)}<br>` : ""}
          ${p.signed ? `<strong>Signed:</strong> Yes<br>` : ""}
        </p>
        <a class="primary-btn" target="_blank" rel="noopener"
           href="${buildWhatsAppLink(`Hi, I'd like to enquire / reserve: ${p.name}. Please advise next steps.`)}">
          Enquire / Reserve
        </a>
        <a class="secondary-btn" href="index.html">Back to shop</a>
      `
          : `
        <button type="button" onclick="addToCart('${safeId}')">Add to cart</button>
        <a class="secondary-btn" target="_blank" rel="noopener"
           href="${buildWhatsAppLink(`Hi, I'm interested in ${p.name}. Can you share more details?`)}">
          Enquire on WhatsApp
        </a>
        <a class="secondary-btn" href="index.html">Back to shop</a>
      `
      }
    </section>
  `;

  wireCartPanel();
  updateCartCount();
  renderCartPanel(products);
}

/* ---------- Cart panel (optional UI) ---------- */
function wireCartPanel() {
  const panel = document.getElementById("cartPanel");
  const openBtn = document.getElementById("cartButton");
  const closeBtn = document.getElementById("closeCart");

  if (openBtn && panel) openBtn.onclick = () => panel.classList.add("open");
  if (closeBtn && panel) closeBtn.onclick = () => panel.classList.remove("open");

  // Qty buttons
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-qty]");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const delta = Number(btn.getAttribute("data-qty"));
    if (!id || !Number.isFinite(delta)) return;
    updateQty(id, delta);
  });
}

function renderCartPanel(products) {
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  if (!itemsEl || !totalEl) return;

  const cart = readCart();
  if (!cart.length) {
    itemsEl.innerHTML = `<p class="cart-note">Your cart is empty.</p>`;
    totalEl.textContent = moneyZAR(0);
    return;
  }

  let total = 0;
  itemsEl.innerHTML = cart
    .map((ci) => {
      const p = products.find((x) => x.id === ci.id);
      if (!p) return "";
      const line = Number(p.price || 0) * Number(ci.qty || 0);
      total += line;

      return `
        <div class="cart-item">
          <img src="${getImagePath(p)}" onerror="this.onerror=null;this.src='${getImageFallback(p)}'">
          <div>
            <strong>${escapeHtml(p.name)}</strong><br>
            ${moneyZAR(p.price)}
            <div>
              <button type="button" data-qty="-1" data-id="${escapeHtml(p.id)}">−</button>
              Qty ${ci.qty}
              <button type="button" data-qty="1" data-id="${escapeHtml(p.id)}">+</button>
            </div>
          </div>
          <strong>${moneyZAR(line)}</strong>
        </div>
      `;
    })
    .join("");

  totalEl.textContent = moneyZAR(total);
}

/* ---------- Checkout renderer ---------- */
function renderCheckout(products) {
  const cartEl = document.getElementById("cart");
  const totalEl = document.getElementById("checkoutTotal");
  if (!cartEl || !totalEl) return;

  const cart = readCart();
  if (!cart.length) {
    cartEl.innerHTML = `<p class="cart-note">Your cart is empty.</p>`;
    totalEl.textContent = moneyZAR(0);
    return;
  }

  let total = 0;
  cartEl.innerHTML = cart
    .map((ci) => {
      const p = products.find((x) => x.id === ci.id);
      if (!p) return "";
      const line = Number(p.price || 0) * Number(ci.qty || 0);
      total += line;

      return `
        <div class="checkout-item">
          <img src="${getImagePath(p)}" onerror="this.onerror=null;this.src='${getImageFallback(p)}'">
          <div class="name">${escapeHtml(p.name)}</div>
          <strong>${moneyZAR(line)}</strong>
        </div>
      `;
    })
    .join("");

  totalEl.textContent = moneyZAR(total);
}

/* ---------- WhatsApp Curator button support ---------- */
function openChat() {
  // Called by your <div class="whatsapp-chat" onclick="openChat()">
  const url = buildWhatsAppLink("Hi! I’d like recommendations from Tinkers (gifting, décor, or wearable items).");
  window.open(url, "_blank", "noopener");
}

/* ---------- Init (single initializer) ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    updateCartCount();

    const products = await loadProducts();
    window.__products = products;

    if (document.getElementById("products")) {
      wireNavFilters(products);
      renderHome(products);
      wireCartPanel();
      renderCartPanel(products);
    }

    if (document.getElementById("detailRoot")) {
      renderProductDetail(products);
    }

    if (document.getElementById("checkoutTotal")) {
      wireCartPanel();
      renderCartPanel(products);
      renderCheckout(products);
    }
  } catch (err) {
    console.error(err);
  }
});
