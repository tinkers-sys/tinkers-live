"use strict";

/* =======================
   GLOBAL CART
======================= */
let cart = [];

/* =======================
   TOGGLE CART DRAWER
======================= */
function toggleCart() {
  document.getElementById("cartDrawer").classList.toggle("open");
}

/* =======================
   ADD TO CART
======================= */
function addToCart(product) {
  cart.push(product);
  updateCart();
}

/* =======================
   UPDATE CART UI
======================= */
function updateCart() {

  const cartEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");

  if (!cartEl || !totalEl) return;

  cartEl.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    total += item.price;

    cartEl.innerHTML += `
      <div>
        ${item.name} - R${item.price}
      </div>
    `;
  });

  totalEl.textContent = total;
}

/* =======================
   LOAD PRODUCTS
======================= */
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

/* =======================
   BUILD PRODUCT CARD
======================= */
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

      <!-- ✅ CLEAN BUTTON -->
      <button class="add-btn"
        data-name="${p.name}"
        data-price="${p.price}"
        data-image="${p.image}">
        Add to cart
      </button>

    </div>
  `;
}

/* =======================
   RENDER PRODUCTS
======================= */
function render(id, data) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = data.map(buildCard).join("");
}

/* =======================
   FILTERS
======================= */
function setupFilters(products) {

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", e => {
      e.preventDefault();

      document.querySelectorAll(".filters a")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");

      const category = btn.dataset.filter.toLowerCase();

      let filtered;

      if (category === "all") {
        filtered = products;
      } else {
        filtered = products.filter(p => p.category === category);
      }

      render("products", filtered);

      // hide top sections when filtering
      document.getElementById("featuredSection").style.display = "none";
      document.getElementById("trendingSection").style.display = "none";

    });

  });
}

/* =======================
   WHATSAPP CHECKOUT
======================= */
function whatsappOrder() {

  if (!cart.length) {
    alert("Cart is empty ❌");
    return;
  }

  let message = "🛍️ Tinkers Order\n\n";
  let total = 0;

  cart.forEach(item => {
    total += item.price;
    message += `${item.name} - R${item.price}\n`;
  });

  message += `\nTotal: R${total}`;

  window.open(
    `https://wa.me/27720912943?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

/* =======================
   PAYFAST
======================= */
function payfastCheckout() {

  if (!cart.length) {
    alert("Cart is empty ❌");
    return;
  }

  let total = 0;
  cart.forEach(item => total += item.price);

  const params = new URLSearchParams({
    merchant_id: "10000100",
    merchant_key: "46f0cd694581a",
    amount: total.toFixed(2),
    item_name: "Tinkers Order",
    return_url: "success.html",
    cancel_url: "cancel.html"
  });

  window.location.href =
    "https://sandbox.payfast.co.za/eng/process?"
    + params.toString();
}

/* =======================
   CLEAR CART
======================= */
function clearCart() {
  cart = [];
  updateCart();
}

/* =======================
   INIT
======================= */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();

  render("products", products);

  render("featuredProducts",
    products.filter(p => p.price >= 1500)
  );

  render("trendingProducts",
    products.filter(p =>
      p.price >= 500 && p.price < 1500
    )
  );

  setupFilters(products);
});
document.addEventListener("click", function(e) {

  if (e.target.classList.contains("add-btn")) {

    const product = {
      name: e.target.dataset.name,
      price: Number(e.target.dataset.price),
      image: e.target.dataset.image
    };

    cart.push(product);
    updateCart();
  }

});

