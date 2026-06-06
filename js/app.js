"use strict";

const PRODUCTS_URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";

async function loadProducts() {
  const res = await fetch(PRODUCTS_URL);
  const data = await res.json();

  return data.map(p => ({
    ...p,
    id: String(p.id || p.ID),
    price: Number(p.price)
  }));
}

function buildCard(p) {
  return `
    <div class="card">
      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p class="price">R${p.price}</p>
      <button onclick="addToCart('${p.id}')">Add to cart</button>
    </div>
  `;
}

function renderSection(id, products) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = products.map(buildCard).join("");
}

function renderProducts(products, category = "All") {
  const grid = document.getElementById("products");
  if (!grid) return;

  const filtered = category === "All"
    ? products
    : products.filter(p => p.category === category);

  grid.innerHTML = filtered.map(buildCard).join("");
}

function wireFilters(products) {
  document.querySelectorAll(".filters a").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      renderProducts(products, btn.dataset.filter);
    });
  });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();

  const featured = products.slice(0, 4);
  const trending = products.slice(4, 10);
  const shop = products.slice(10);

  renderSection("featuredProducts", featured);
  renderSection("trendingProducts", trending);
  renderProducts(shop);

  wireFilters(shop);

});
/* ===============================
   SCROLL ANIMATION (AI FEEL)
================================ */
function animateOnScroll() {

  const elements = document.querySelectorAll(".fade-in");

  elements.forEach(el => {
    const position = el.getBoundingClientRect().top;

    if (position < window.innerHeight - 100) {
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", animateOnScroll);
/* ===============================
   HERO PARALLAX EFFECT
================================ */
window.addEventListener("scroll", function () {
  const hero = document.querySelector(".hero-banner");

  if (!hero) return;

  let offset = window.pageYOffset;

  hero.style.backgroundPositionY = offset * 0.5 + "px";
});


