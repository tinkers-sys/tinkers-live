/* Tinkers — app.js (static hosting friendly: GitHub Pages + Cloudflare Pages)
   - Loads products from ./products.json
   - Renders: Home (grid + featured original), Product detail, Cart panel, Checkout
*/

"use strict";

const PRODUCTS_URL = "./products.json";
const CART_KEY = "tinkers_cart_v1";

// ✅ Put your WhatsApp number here (country code + number, no spaces)
const WHATSAPP_NUMBER = "27682525454";

/* ---------- Helpers ---------- */
function moneyZAR(value) {
  const n = Number(value || 0);
  return "R" + n.toLocaleString("en-ZA");
}

function whatsappLinkForProduct(product, extra = "") {
  const name = product?.name || "a product";
  const msg = `Hi, I'm interested in ${name}. ${extra}`.trim();
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/**
 * Robust image resolver:
 * - If product.image is already a path like "images/products/x.jpg" -> use as-is
 * - If product.image includes a folder like "products/x.jpg" -> prefix with "images/"
 * - If product.image is just "x.jpg" -> assume "images/products/x.jpg" first (fallback to "images/x.jpg" via onerror)
 */
function resolveImagePrimary(product) {
  const img = product && (product.image || product.filename);
  if (!img) return "";

  if (/^https?:\/\//i.test(img)) return img;          // absolute URL
  if (img.startsWith("images/")) return img;          // already rooted correctly

  if (img.includes("/")) return "images/" + img;      // e.g. "products/x.jpg" -> "images/products/x.jpg"

  // filename only -> prefer products subfolder
  return "images/products/" + img;
}

function resolveImageFallback(product) {
  const img = product && (product.image || product.filename);
  if (!img) return "";
  if (/^https?:\/\//i.test(img)) return img;
  if (img.startsWith("images/")) return img;

  // filename only fallback
  if (!img.includes("/")) return "images/" + img;

  // if it had folder and failed, fallback to "images/<filename>"
  const file = img.split("/").pop();
  return file ? "images/" + file : "";
}

function imgTag(product, alt = "") {
  const primary = resolveImagePrimary(product);
  const fallback = resolveImageFallback(product);

  if (!primary) {
    // If you have a placeholder image, set it here:
    // return `<img src="images/placeholder.jpg" alt="${escapeHtml(alt)}">`;
    return `<div class="img-missing">No image</div>`;
  }

  // Use onerror fallback only when it is different
  if (fallback && fallback !== primary) {
    return `<img src="${primary}" alt="${escapeHtml(alt)}" onerror="this.onerror=null;this.src='${fallback}'">`;
  }

  return `<img src="${primary}" alt="${escapeHtml(alt)}">`;
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

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;

  const count = readCart().reduce((sum, x) => sum + x.qty, 0);
  el.textContent = String(count);
}

/* ---------- Data ---------- */
async function loadProducts() {
  const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Could not load products.json");

  const data = await res.json();

  // supports either array OR {products:[...]} while staying compatible with your current array
  const products = Array.isArray(data) ? data : (data.products || []);
  return products;
}

/* ---------- Navigation Filters (optional) ---------- */
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

/* ---------- Homepage ---------- */
/**
 * Expects:
 * - grid container:  <div id="products"></div>
 * - optional featured: <section id="originalArt"></section>
 */
function renderHome(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  // Featured Original Artwork block
  const originals = products.filter((p) => (p.type || "").toLowerCase() === "original");
  const featured = document.getElementById("originalArt");

  if (featured && originals.length) {
    const p = originals[0];
    featured.style.display = "block";

    const badgeText = p.signed ? "Original · Signed" : "Original Artwork";

    featured.innerHTML = `
      <div class="featured-art-inner">
        <div class="featured-art-image">
          ${imgTag(p, p.name)}
        </div>
        <div>
          <span class="art-badge">${escapeHtml(badgeText)}</span>
          <h2>${escapeHtml(p.name)}</h2>
          <p class="artist">By ${escapeHtml(p.artist || "Artist")}</p>

          <div class="art-meta">
            ${p.medium ? `<span>Medium: ${escapeHtml(p.medium)}</span>` : ""}
            ${p.edition ? `<span>Edition: ${escapeHtml(p.edition)}</span>` : ""}
          </div>

          <div class="art-price">${moneyZAR(p.price)}</div>

          <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <a class="primary-btn" href="product.html?id=${encodeURIComponent(p.id)}">View Artwork Details</a>
            <a class="secondary-btn" href="${whatsappLinkForProduct(p, "I would like to enquire/reserve.")}" target="_blank" rel="noopener">Enquire on WhatsApp</a>
          </div>
        </div>
      </div>
    `;
  } else if (featured) {
    featured.style.display = "none";
    featured.innerHTML = "";
  }

  // Retail products list (exclude originals)
  const retail = products.filter((p) => (p.type || "").toLowerCase() !== "original");
  const filtered = category === "All" ? retail : retail.filter((p) => p.category === category);

  grid.innerHTML = filtered
    .map((p) => {
      const safeId = String(p.id || "").replace(/'/g, "\\'");
      return `
        <div class="card">
          ${imgTag(p, p.name)}
          <h3>${escapeHtml(p.name)}</h3>
          <p class="category">${escapeHtml(p.category || "")}</p>
          <p class="price">${moneyZAR(p.price)}</p>

          <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <a class="secondary-btn" href="product.html?id=${encodeURIComponent(p.id)}">View</a>
            <button type="button" onclick="addToCart('${safeId}')">Add to cart</button>
            <a class="btn-whatsapp" href="${whatsappLinkForProduct(p)}" target="_blank" rel="noopener">WhatsApp</a>
          </div>
        </div>
      `;
    })
    .join("");
}

/* ---------- Product Page ---------- */
/**
 * Expects:
 * - detail root: <div id="detailRoot"></div>
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
    <section class="detail">
      <div class="detail-media">
        ${imgTag(p, p.name)}
      </div>

      <h1>${escapeHtml(p.name)}</h1>
      <p class="category">${escapeHtml(p.category || "")}${isOriginal && p.artist ? " · " + escapeHtml(p.artist) : ""}</p>
      <p class="price">${moneyZAR(p.price)}</p>

      ${
        isOriginal
          ? `
        <div class="original-meta">
          ${p.medium ? `<p><strong>Medium:</strong> ${escapeHtml(p.medium)}</p>` : ""}
          ${p.edition ? `<p><strong>Edition:</strong> ${escapeHtml(p.edition)}</p>` : ""}
          ${p.signed ? `<p><strong>Signed:</strong> Yes</p>` : ""}
        </div>

        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <a class="primary-btn" href="${whatsappLinkForProduct(p, "I would like to enquire/reserve this original artwork.")}" target="_blank" rel="noopener">Enquire / Reserve</a>
          <a class="secondary-btn" href="index.html">Back to shop</a>
        </div>
      `
          : `
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button type="button" onclick="addToCart('${safeId}')">Add to cart</button>
          <a class="btn-whatsapp" href="${whatsappLinkForProduct(p)}" target="_blank" rel="noopener">Enquire on WhatsApp</a>
          <a class="secondary-btn" href="index.html">Back to shop</a>
        </div>
      `
      }
    </section>
  `;

  wireCartPanel();
  updateCartCount();
  renderCartPanel(products);
}

/* ---------- Cart Panel ---------- */
/**
 * Optional elements:
 * - cartPanel, cartButton, closeCart
 * - cartItems, cartTotal
 * - buttons inside panel with data-qty and data-id
 */
function wireCartPanel() {
  const panel = document.getElementById("cartPanel");
  const openBtn = document.getElementById("cartButton");
  const closeBtn = document.getElementById("closeCart");

  if (openBtn && panel) openBtn.onclick = () => panel.classList.add("open");
  if (closeBtn && panel) closeBtn.onclick = () => panel.classList.remove("open");

  // Qty buttons inside panel
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-qty]");
    if (!btn) return;

    const id = btn.getAttribute("data-id");
    const delta = Number(btn.getAttribute("data-qty"));
    if (!id || !Number.isFinite(delta)) return;

    updateQty(id, delta);
  });

  // Optional clear cart button
  const clearBtn = document.getElementById("clearCart");
  if (clearBtn) clearBtn.onclick = () => clearCart();
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
          <div class="cart-thumb">${imgTag(p, p.name)}</div>
          <div class="cart-info">
            <strong>${escapeHtml(p.name)}</strong><br>
            ${moneyZAR(p.price)}
            <div class="qty">
              <button type="button" data-qty="-1" data-id="${escapeHtml(p.id)}">−</button>
              <span>Qty ${ci.qty}</span>
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

/* ---------- Checkout ---------- */
/**
 * Expects (on checkout page):
 * - cart container: <div id="cart"></div>
 * - total: <span id="checkoutTotal"></span>
 */
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
          <div class="checkout-thumb">${imgTag(p, p.name)}</div>
          <div class="name">${escapeHtml(p.name)}</div>
          <strong>${moneyZAR(line)}</strong>
        </div>
      `;
    })
    .join("");

  totalEl.textContent = moneyZAR(total);

  // Optional: WhatsApp checkout/enquiry button
  const checkoutWhatsApp = document.getElementById("checkoutWhatsApp");
  if (checkoutWhatsApp) {
    const msgLines = cart
      .map((ci) => {
        const p = products.find((x) => x.id === ci.id);
        if (!p) return null;
        return `• ${p.name} x${ci.qty} (${moneyZAR(p.price)})`;
      })
      .filter(Boolean);

    const msg = `Hi, I'd like to place an order/enquiry:\n${msgLines.join("\n")}\nTotal: ${moneyZAR(total)}`;
    checkoutWhatsApp.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }
}

/* ---------- Init (single initializer) ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    updateCartCount();

    const products = await loadProducts();
    window.__products = products; // so cart functions can re-render

    // Home page
    if (document.getElementById("products")) {
      wireNavFilters(products);
      renderHome(products);
      wireCartPanel();
      renderCartPanel(products);
    }

    // Product detail page
    if (document.getElementById("detailRoot")) {
      renderProductDetail(products);
    }

    // Checkout page
    if (document.getElementById("checkoutTotal")) {
      wireCartPanel();
      renderCartPanel(products);
      renderCheckout(products);
    }
  } catch (err) {
    console.error(err);
  }
});
``
