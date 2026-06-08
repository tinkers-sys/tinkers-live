"use strict";

/* ===============================
✅ GLOBAL CART STATE
=============================== */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ===============================
✅ LOAD PRODUCTS (GOOGLE SHEET)
=============================== */
async function loadProducts() {
  const res = await fetch("https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1");
  const data = await res.json();

  return data.map(p => ({
    id: p.name, // use name as ID
    name: p.name || "Unknown",
    price: Number(p.price) || 0,
    image: p.image || "default.jpg",
    category: (p.category || "").toLowerCase()
  }));
}

/* ===============================
✅ PRODUCT CARD
=============================== */
function buildCard(p) {
  return `
    <div class="product-card">
      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p>R${p.price}</p>

      <button class="add-btn"
        onclick="addToCart('${p.id}', '${p.name}', ${p.price}, '${p.image}')">
        Add to cart
      </button>
    </div>
  `;
}

/* ===============================
✅ ADD TO CART (FIXED)
=============================== */
function addToCart(id, name, price, image) {
  let item = cart.find(i => i.id === id);

  if (item) {
    item.qty += 1;
  } else {
    cart.push({
      id,
      name,
      price: Number(price),
      image,
      qty: 1
    });
  }

  saveCart();
}

/* ===============================
✅ SAVE CART
=============================== */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
  renderCheckout();
}

/* ===============================
✅ UPDATE CART UI (GLOBAL)
=============================== */
function updateCartUI() {

  let totalItems = 0;
  let totalPrice = 0;

  cart.forEach(item => {
    totalItems += item.qty;
    totalPrice += item.price * item.qty;
  });

  // ✅ Badge
  const badge = document.querySelector(".cart-count");
  if (badge) {
    badge.innerText = totalItems;
  }

  // ✅ Drawer list
  const el = document.getElementById("cartItems");
  if (el) {

    el.innerHTML = "";

    cart.forEach(item => {

      const subtotal = item.price * item.qty;

      el.innerHTML += `
        <div class="cart-item">

          <span>${item.name}</span>

          <div class="qty-controls">
            <button onclick="changeQty('${item.id}',1)">+</button>
            <button onclick="changeQty('${item.id}',-1)">-</button>
          </div>

          <span>R${subtotal}</span>
        </div>
      `;
    });
  }

  // ✅ Total
  const totalEl = document.getElementById("cartTotal");
  if (totalEl) {
    totalEl.innerText = "R " + totalPrice.toFixed(2);
  }

}

/* ===============================
✅ CHANGE QUANTITY
=============================== */
function changeQty(id, amt) {
  let item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += amt;

  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  saveCart();
}

/* ===============================
✅ CLEAR CART
=============================== */
function clearCart() {
  cart = [];
  saveCart();
}

/* ===============================
✅ CART DRAWER
=============================== */
function toggleCart() {
  document.getElementById("cartDrawer").classList.toggle("open");
}

/* ===============================
✅ FILTERS
=============================== */
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

/* ===============================
✅ CHECKOUT PAGE
=============================== */
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
          <button onclick="changeQty('${item.id}',1)">+</button>
          <button onclick="changeQty('${item.id}',-1)">-</button>
        </div>

        <strong>R${subtotal}</strong>
      </div>
    `;
  });

  if (totalEl) {
    totalEl.innerText = "R " + total.toFixed(2);
  }
}

/* ===============================
✅ PREPARE ORDER (CRITICAL FIX)
=============================== */
function prepareOrder() {

  if (cart.length === 0) {
    alert("Cart is empty ❌");
    return false;
  }

  let total = 0;

  const items = cart.map(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;

    return {
      name: item.name,
      qty: item.qty,
      subtotal: subtotal.toFixed(2)
    };
  });

  const order = {
    orderID: "TINK" + Date.now(),
    date: new Date().toLocaleString(),
    items: items,
    total: total.toFixed(2)
  };

  // ✅ SAVE ORDER BEFORE PAYFAST
  localStorage.setItem("lastOrder", JSON.stringify(order));

  // ✅ SET PAYFAST AMOUNT
  const amountField = document.getElementById("payfast-amount");
  if (amountField) {
    amountField.value = total.toFixed(2);
  }

  return true;
}

/* ===============================
✅ WHATSAPP ORDER
=============================== */
function whatsappOrder() {

  let msg = "🧾 Tinkers Order\n\n";
  let total = 0;

  cart.forEach(i => {
    let sub = i.price * i.qty;
    total += sub;
    msg += `${i.name} x${i.qty} - R${sub}\n`;
  });

  msg += `\nTotal: R${total}`;

  window.open("https://wa.me/27720912943?text=" + encodeURIComponent(msg));
}

/* ===============================
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", async () => {

  updateCartUI();

  // ✅ If checkout page
  if (document.getElementById("checkoutGrid")) {
    renderCheckout();
  }

  // ✅ If products page
  const productContainer = document.getElementById("products");

  if (productContainer) {
    const products = await loadProducts();

    productContainer.innerHTML = products.map(buildCard).join("");
    setupFilters(products);
  }

});
