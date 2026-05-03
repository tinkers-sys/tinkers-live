"use strict";

/* Tinkers — app.js (GitHub Pages + Cloudflare Pages friendly)
   Source of truth: ./products.json
   Fallback: window.TINKERS_PRODUCTS (embedded in product.html)
*/

const PRODUCTS_URL = "./products.json";
const CART_KEY = "tinkers_cart_v1";

// ✅ Your WhatsApp number (country code + number, no spaces)
const WHATSAPP_NUMBER = "27682525454";

// Keep products in memory so cart refresh works on any page
window.__products = window.__products || [];

/* ---------- Helpers ---------- */
function moneyZAR(value) {
  const n = Number(value || 0);
  return "R" + n.toLocaleString("en-ZA");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function buildWhatsAppLink(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Image resolution:
 * - If p.image already includes "images/" => use as-is
 * - If p.image includes "products/..." => prefix "images/"
 * - If p.image is filename only => use "images/<filename>"
 * Fallback: "images/products/<filename>" if primary fails
 */
function getImagePath(p) {
  const img = p && (p.image || p.filename);
  if (!img) return "";

  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith("images/")) return img;
  if (img.includes("/")) return "images/" + img;

  // filename-only
  return "images/" + img;
}

function getImageFallback(p) {
  const img = p && (p.image || p.filename);
  if (!img) return "";
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith("images/")) return img;
  if (img.includes("/")) return "images/" + img;

  // filename-only fallback
  return "images/products/" + img;
}

function productImgTag(p, className = "") {
  const src = getImagePath(p);
  if (!src) return `<div class="img-missing">No image</div>`;

  const fb = getImageFallback(p);
  const cls = className ? `class="${className}"` : "";
  const alt = escapeHtml(p?.name || "Product");

  // onerror fallback supports both images/<file> and images/products/<file>
  if (fb && fb !== src) {
    return `<img ${cls} src="${src}" alt="${alt}" loading="lazy" onerror="this.onerror=null;this.src='${fb}'">`;
  }
  return `<img ${cls} src="${src}" alt="${alt}" loading="lazy">`;
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

function clearCart() {
  writeCart([]);
  updateCartCount();
  renderCartPanel(window.__products || []);
  renderCheckout(window.__products || []);
}

/* ---------- Data ---------- */
async function loadProducts() {
  // Primary: products.json
  try {
    const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error("Could not load products.json");
    const data = await res.json();
    const products = Array.isArray(data) ? data : (data.products || []);
    return products;
  } catch (err) {
    // Fallback: embedded list from product.html (window.TINKERS_PRODUCTS)
    const fallback = window.TINKERS_PRODUCTS;
    if (Array.isArray(fallback) && fallback.length) return fallback;
    throw err;
  }
}

/* ---------- Nav filtering (index.html) ---------- */
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

/* ---------- Homepage renderer (index.html) ---------- */
/* Requires:
   - <section id="originalArt"> (optional)
   - <section id="products"></section>
*/
function renderHome(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  // Featured Original Artwork
  const originals = products.filter((p) => (p.type || "").toLowerCase() === "original");
  const featured = document.getElementById("originalArt");

  if (featured && originals.length) {
    const p = originals[0];
    featured.style.display = "block";

    const badge = p.signed ? "Original · Signed" : "Original Artwork";

    featured.innerHTML = `
      <div class="featured-art-inner">
        <div class="featured-art-image">
          ${productImgTag(p, "featured-art-image-img")}
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

  // Retail products (exclude originals)
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

/* ---------- Product detail renderer (product.html) ---------- */
/* Requires:
   - <main id="detailRoot"></main>
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

/* ---------- Cart panel wiring (product.html uses this UI) ---------- */
function wireCartPanel() {
  const panel = document.getElementById("cartPanel");
  const openBtn = document.getElementById("cartButton");
  const closeBtn = document.getElementById("closeCart");
  const checkoutBtn = document.getElementById("checkoutButton");

  if (openBtn && panel) openBtn.onclick = () => panel.classList.add("open");
  if (closeBtn && panel) closeBtn.onclick = () => panel.classList.remove("open");

  if (checkoutBtn) checkoutBtn.onclick = () => (location.href = "checkout.html");

  // Qty +/- buttons in cart panel
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
          ${productImgTag(p)}
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

/* ---------- Checkout renderer (checkout.html only has #cart) ---------- */
function renderCheckout(products) {
  const cartEl = document.getElementById("cart");
  if (!cartEl) return;

  // Create a total area if it doesn't exist
  let totalEl = document.getElementById("checkoutTotal");
  if (!totalEl) {
    const wrap = document.createElement("div");
    wrap.style.marginTop = "16px";
    wrap.innerHTML = `Total: <strong id="checkoutTotal">R0</strong>
                      <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
                        <button type="button" onclick="clearCart()">Clear cart</button>
                        <a class="secondary-btn" href="index.html">Back to shop</a>
                      </div>`;
    cartEl.parentElement.appendChild(wrap);
    totalEl = document.getElementById("checkoutTotal");
  }

  const cart = readCart();
  if (!cart.length) {
    cartEl.innerHTML = `<p class="cart-note">Your cart is empty.</p>`;
    if (totalEl) totalEl.textContent = moneyZAR(0);
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
        <div class="checkout-item" style="display:flex; gap:14px; align-items:center; padding:10px 0; border-bottom:1px solid #eee;">
          <div style="width:64px;height:64px;overflow:hidden;border-radius:10px;background:#f2f2f2;display:flex;align-items:center;justify-content:center;">
            ${productImgTag(p)}
          </div>
          <div class="name" style="flex:1;font-weight:700;">${escapeHtml(p.name)}</div>
          <strong>${moneyZAR(line)}</strong>
        </div>
      `;
    })
    .join("");

  if (totalEl) totalEl.textContent = moneyZAR(total);
}

/* ---------- WhatsApp Curator button (index.html uses onclick="openChat()") ---------- */
function openChat() {
  const url = buildWhatsAppLink(
    "Hi! I’d like recommendations from Tinkers (gifting, décor, or wearable items)."
  );
  window.open(url, "_blank", "noopener");
}

/* ---------- Reload functions (NO HTML inside JS) ---------- */
async function reloadProducts() {
  const products = await loadProducts();
  window.__products = products;

  // Re-render depending on page
  if (document.getElementById("products")) renderHome(products);
  if (document.getElementById("detailRoot")) renderProductDetail(products);
  if (document.getElementById("cart")) renderCheckout(products);

  renderCartPanel(products);
  updateCartCount();

  console.log("Products reloaded from products.json");
}

async function reloadProductsAndClearCart() {
  localStorage.removeItem(CART_KEY);
  await reloadProducts();
  console.log("Products reloaded and cart cleared");
}

/* ---------- Init (single initializer) ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    updateCartCount();

    const products = await loadProducts();
    window.__products = products;

    // Home page
    if (document.getElementById("products")) {
      wireNavFilters(products);
      renderHome(products);
    }

    // Product detail page
    if (document.getElementById("detailRoot")) {
      renderProductDetail(products);
    }

    // Checkout page
    if (document.getElementById("cart")) {
      renderCheckout(products);
    }

    // Cart panel (only if present)
    wireCartPanel();
    renderCartPanel(products);
  } catch (err) {
    console.error(err);
  }
});
