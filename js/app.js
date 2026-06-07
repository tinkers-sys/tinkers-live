"use strict";

const URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";

/* ===============================
   CART SYSTEM
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

  const total = readCart().reduce((sum, item) => sum + item.qty, 0);
  el.textContent = total;
}

/* ===============================
   LOAD PRODUCTS (UPDATED)
================================ */
async function loadProducts() {
  const res = await fetch(URL);
  const data = await res.json();

  return data.map(p => ({
    id: String(p.id || p.ID),
    name: p.name,
    category: (p.category || "").toLowerCase(),
    price: Number(p.price),

    // ✅ MULTI IMAGE SUPPORT
    images: [
      p.image,
      p.image2,
      p.image3
    ].filter(Boolean) // removes empty values
  }));
}

/* ===============================
   ADD TO CART
================================ */
function addToCart(id) {
  let cart = readCart();

  const item = cart.find(i => i.id === id);

  if (item) item.qty++;
  else cart.push({ id, qty: 1 });

  writeCart(cart);
  updateCartCount();
}

/* ===============================
   IMAGE SWITCH
================================ */
function swapImg(id, src){
  const img = document.getElementById(`img-${id}`);
  if(img){
    img.src = `images/${src}`;
  }
}

/* ===============================
   PRODUCT CARD (GALLERY ✅)
================================ */
function buildCard(p) {

  const mainImage = p.images[0];

  return `
    <div class="card">

      <img 
        id="img-${p.id}"
        src="images/${mainImage}"
        alt="${p.name}"

        onmouseover="${p.images[1] ? `this.src='images/${p.images[1]}'` : ''}"
        onmouseout="this.src='images/${mainImage}'"
      >

      <div class="thumbs">
        ${p.images.map(img => `
          <img 
            src="images/${img}" 
            onclick="swapImg('${p.id}','${img}')"
          >
        `).join("")}
      </div>

      <h3>${p.name}</h3>
      <p>R${p.price}</p>

      <button class="add-btn" data-id="${p.id}">
        Add to cart
      </button>

    </div>
  `;
}

/* ===============================
   RENDER
================================ */
function render(id, products) {
  const el = document.getElementById(id);
  if (!el) return;

  el.innerHTML = products.map(buildCard).join("");
}

/* ===============================
   FILTERS
================================ */
function setupFilters(products){

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", function(e){
      e.preventDefault();

      const category = this.dataset.filter.toLowerCase();

      const filtered =
        category === "all"
          ? products
          : products.filter(p => p.category.includes(category));

      render("products", filtered);
    });
  });

}

/* ===============================
   CLICK HANDLER
================================ */
document.addEventListener("click", function(e){
  if (e.target.classList.contains("add-btn")) {
    addToCart(e.target.dataset.id);
  }
});

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async () => {

  const products = await loadProducts();
  window.__products = products;

  updateCartCount();

  render("products", products);
  setupFilters(products);

});
