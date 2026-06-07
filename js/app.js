"use strict";

const URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";

/* ===============================
   CART
================================ */
function readCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function writeCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount() {
  const el = document.getElementById("cartCount");
  if (!el) return;

  const total = readCart().reduce((sum, i) => sum + i.qty, 0);
  el.textContent = total;
}

/* ===============================
   LOAD PRODUCTS
================================ */
async function loadProducts() {
  const res = await fetch(URL);
  const data = await res.json();

  return data.map(p => ({
    id: String(p.id || p.ID),
    name: p.name,
    category: (p.category || "").toLowerCase(),
    price: Number(p.price),
    image: p.image,

    featured: (p.featured || "").toLowerCase() === "yes",
    trending: (p.trending || "").toLowerCase() === "yes"
  }));
}

/* ===============================
   PRODUCT CARD
================================ */
function buildCard(p) {
  return `
    <div class="product-card">
      <img src="images/${p.image}" alt="${p.name}">
      <h3 class="product-title">${p.name}</h3>
      <p class="product-price">R${p.price}</p>
      <button class="add-btn" data-id="${p.id}">Add to cart</button>
    </div>
  `;
}

/* ===============================
   RENDER
================================ */
function render(id, products) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = products.length
    ? products.map(buildCard).join("")
    : "<p style='padding:10px'>No products available</p>";
}

/* ===============================
   FILTERS
================================ */
function setupFilters(products) {

  document.querySelectorAll(".filters a").forEach(btn => {
    btn.addEventListener("click", function (e) {
      e.preventDefault();

      document.querySelectorAll(".filters a").forEach(b => b.classList.remove("active"));
      this.classList.add("active");

      const category = this.dataset.filter;

      const filtered = category === "all"
        ? products
        : products.filter(p => p.category === category);

      render("products", filtered);
    });
  });

}

/* ===============================
   ADD TO CART
================================ */
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("add-btn")) {

    let cart = readCart();
    const id = e.target.dataset.id;

    const item = cart.find(i => i.id === id);

    if (item) item.qty++;
    else cart.push({ id, qty: 1 });

    writeCart(cart);
    updateCartCount();
  }
});

/* ===============================
   SMART SECTIONS
================================ */
function renderSections(products){

  const curated = products.filter(p => 
    p.featured || p.price >= 1500
  );

  const trending = products.filter(p => 
    p.trending || (p.price >= 500 && p.price < 1500)
  );

  render("featuredProducts", curated.slice(0, 4));
  render("trendingProducts", trending.slice(0, 4));

  // hide empty sections
  if (!curated.length) document.getElementById("featuredSection").style.display = "none";
  if (!trending.length) document.getElementById("trendingSection").style.display = "none";
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();
  window.__products = products;

  updateCartCount();

  if (document.getElementById("products")) {
    render("products", products);
    setupFilters(products);
    renderSections(products);
  }

});
