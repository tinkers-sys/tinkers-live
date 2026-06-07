"use strict";

let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ============================
   LOAD PRODUCTS FROM SHEET
============================= */
async function loadProducts() {
  const res = await fetch("https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1");
  const data = await res.json();

  return data.map(p => ({
    name: p.name,
    category: (p.category || "").toLowerCase(),
    price: Number(p.price),
    image: p.image
  }));
}

/* ============================
   BUILD PRODUCT CARD
============================= */
function buildCard(p) {

  let badge = "";

  if (p.price >= 1500) {
    badge = `<span class="badge premium">PREMIUM</span>`;
  } else if (p.price >= 700) {
    badge = `<span class="badge hot">HOT</span>`;
  }

  return `
    <div class="product-card">

      ${badge}

      <div class="img-wrap">
        <img src="images/${p.image}" alt="${p.name}">
      </div>

      <h3>${p.name}</h3>
      <p>R${p.price}</p>

      <!-- ✅ data attributes -->
      <button class="add-btn"
        data-name="${p.name}"
        data-price="${p.price}"
        data-image="${p.image}">
        Add to cart
      </button>

    </div>
  `;
}

/* ============================
   RENDER
============================= */
function render(id, products) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = products.map(buildCard).join("");
}

/* ============================
   ADD TO CART (FIXED)
============================= */
document.addEventListener("click", function(e) {

  if (e.target.classList.contains("add-btn")) {

    const product = {
      name: e.target.dataset.name,
      price: Number(e.target.dataset.price),
      image: e.target.dataset.image,
      qty: 1
    };

    // ✅ CHECK IF ALREADY IN CART
    const existing = cart.find(i => i.name === product.name);

    if (existing) {
      existing.qty++;
    } else {
      cart.push(product);
    }

    updateCart();
    toggleCart(true);
  }
});

/* ============================
   UPDATE CART UI (UPGRADED)
============================= */
function updateCart() {

  const cartEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!cartEl || !totalEl) return;

  cartEl.innerHTML = "";

  let total = 0;

  cart.forEach(item => {

    const subtotal = item.price * item.qty;
    total += subtotal;

    cartEl.innerHTML += `
      <div class="cart-item">
        <img src="images/${item.image}">

        <div>
          <p>${item.name}</p>
          <small>R${item.price} x ${item.qty}</small>
        </div>

        <div class="cart-actions">
          <button onclick="changeQty('${item.name}', 1)">+</button>
          <button onclick="changeQty('${item.name}', -1)">-</button>
          <button onclick="removeItem('${item.name}')">✕</button>
        </div>
      </div>
    `;
  });

  totalEl.textContent = total;
  localStorage.setItem("cart", JSON.stringify(cart));
 
}

/* ============================
   CART CONTROLS
============================= */
function changeQty(name, amount) {

  const item = cart.find(i => i.name === name);
  if (!item) return;

  item.qty += amount;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.name !== name);
  }

  updateCart();
}

function removeItem(name) {
  cart = cart.filter(i => i.name !== name);
  updateCart();
}

function clearCart() {
  cart = [];
  updateCart();
}

/* ============================
   DRAWER CONTROL
============================= */
function toggleCart(show = false) {
  const drawer = document.getElementById("cartDrawer");

  if (show) drawer.classList.add("open");
  else drawer.classList.toggle("open");
}

/* ============================
   WHATSAPP CHECKOUT
============================= */
function whatsappOrder() {

  if (!cart.length) {
    alert("Cart is empty ❌");
    return;
  }

  let message = "🛍️ Tinkers Order\n\n";
  let total = 0;

  cart.forEach(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    message += `${item.name} x${item.qty} - R${subtotal}\n`;
  });

  message += `\nTotal: R${total}`;

  window.open(
    `https://wa.me/27720912943?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

/* ============================
   PAYFAST
============================= */
function payfastCheckout() {

  if (!cart.length) {
    alert("Cart is empty ❌");
    return;
  }

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

/* ============================
   INIT
============================= */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();

  render("products", products);

  render("featuredProducts",
    products.filter(p => p.price >= 1500)
  );

  render("trendingProducts",
    products.filter(p => p.price >= 500 && p.price < 1500)
  );

});


