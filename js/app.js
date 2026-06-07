"use strict";

let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* LOAD PRODUCTS */
async function loadProducts() {

  const res = await fetch("https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1");
  const data = await res.json();

  return data.map(p => ({
    name: p.name || "Unknown",
    price: Number(p.price) || 0,
    image: p.image || "default.jpg"
  }));
}

/* BUILD CARD */
function buildCard(p) {
  return `
    <div class="product-card">
      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p>R${p.price}</p>
      <button onclick="addToCart('${p.name}', ${p.price}, '${p.image}')">
        Add to cart
      </button>
    </div>
  `;
}

/* ADD TO CART */
function addToCart(name, price, image) {

  const item = cart.find(i => i.name === name);

  if (item) {
    item.qty++;
  } else {
    cart.push({ name, price, image, qty: 1 });
  }

  saveCart();
}

/* SAVE */
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCart();
}

/* UPDATE CART DRAWER */
function updateCart() {

  const cartEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!cartEl) return;

  cartEl.innerHTML = "";

  let total = 0;

  cart.forEach(item => {

    const subtotal = item.price * item.qty;
    total += subtotal;

    cartEl.innerHTML += `
      <div>
        ${item.name} x${item.qty} - R${subtotal}
      </div>
    `;
  });

  totalEl.textContent = total;
}

/* DRAWER */
function toggleCart() {
  document.getElementById("cartDrawer").classList.toggle("open");
}

/* CLEAR */
function clearCart() {
  cart = [];
  saveCart();
}

/* CHECKOUT PAGE */
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
        <strong>R${subtotal}</strong>
      </div>
    `;
  });

  totalEl.textContent = total;
}

/* WHATSAPP */
function whatsappOrder() {

  let message = "Tinkers Order\n";
  let total = 0;

  cart.forEach(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;
    message += `${item.name} x${item.qty} - R${subtotal}\n`;
  });

  message += `Total: R${total}`;

  window.open(`https://wa.me/27720912943?text=${encodeURIComponent(message)}`);
}

/* PAYFAST */
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

  updateCart();
});
