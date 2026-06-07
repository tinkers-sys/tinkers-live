"use strict";

const URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";

/* LOAD PRODUCTS */
async function loadProducts() {
  const res = await fetch(URL);
  const data = await res.json();

  return data.map(p => ({
    id: String(p.id || p.ID),
    name: p.name,
    category: (p.category || "").toLowerCase(),
    price: Number(p.price),
    image: p.image
  }));
}

/* PRODUCT CARD */
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
      <button class="add-btn">Add to cart</button>
    </div>
  `;
}

/* RENDER */
function render(id, products) {
  document.getElementById(id).innerHTML =
    products.map(buildCard).join("");
}

/* FILTERS */
function setupFilters(products) {
  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", e => {
      e.preventDefault();

      document.querySelectorAll(".filters a").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const cat = btn.dataset.filter;

      if (cat === "all") {
        render("products", products);
      } else {
        render("products", products.filter(p => p.category === cat));
      }

      document.getElementById("featuredSection").style.display = "none";
      document.getElementById("trendingSection").style.display = "none";
    });

  });
}

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();

  render("products", products);

  // SMART SECTIONS
  render("featuredProducts", products.filter(p => p.price > 1200));
  render("trendingProducts", products.filter(p => p.price >= 500 && p.price <= 1200));

  setupFilters(products);
});

