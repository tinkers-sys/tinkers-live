"use strict";

const URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";

/* ===============================
   CART
================================ */
function readCart(){
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function writeCart(cart){
  localStorage.setItem("cart", JSON.stringify(cart));
}

function updateCartCount(){
  const el = document.getElementById("cartCount");
  if(!el) return;

  const total = readCart().reduce((s,i) => s + i.qty, 0);
  el.textContent = total;
}

/* ===============================
   LOAD PRODUCTS
================================ */
async function loadProducts(){
  const res = await fetch(URL);
  const data = await res.json();

  return data.map(p => ({
    id: String(p.id || p.ID),
    name: p.name,
    category: (p.category || "").trim(),
    image: p.image,
    price: Number(p.price)
  }));
}

/* ===============================
   ADD TO CART
================================ */
function addToCart(id){
  let cart = readCart();
  const item = cart.find(i => i.id === id);

  if(item) item.qty++;
  else cart.push({id, qty:1});

  writeCart(cart);
  updateCartCount();
}

/* ===============================
   CARD
================================ */
function buildCard(p){
  return `
    <div class="card">
      <img src="images/${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="price">R${p.price}</p>
      <button class="add-btn" data-id="${p.id}">Add to cart</button>
    </div>
  `;
}

/* ===============================
   RENDER
================================ */
function render(id, products){
  const el = document.getElementById(id);
  if(!el) return;

  el.innerHTML = products.map(buildCard).join("");
}

/* ===============================
   FILTER (FINAL FIX ✅)
================================ */
function setupFilters(){

  const shopProducts = window.__shopProducts;

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", e=>{
      e.preventDefault();

      const cat = btn.dataset.filter;

      const filtered =
        cat === "All"
          ? shopProducts
          : shopProducts.filter(p =>
              p.category.toLowerCase() === cat.toLowerCase()
            );

      render("products", filtered);

      // ✅ update title
      const title = document.getElementById("sectionTitle");
      if(title){
        title.innerText =
          cat === "All"
            ? "Our Collection"
            : "Showing: " + cat;
      }

      // ✅ active style
      document.querySelectorAll(".filters a").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

    });

  });

}

/* ===============================
   CLICK HANDLER
================================ */
document.addEventListener("click", function(e){
  if(e.target.classList.contains("add-btn")){
    addToCart(e.target.dataset.id);
  }
});

/* ===============================
   INIT (CRITICAL FIX ✅)
================================ */
document.addEventListener("DOMContentLoaded", async ()=>{

  const products = await loadProducts();

  updateCartCount();

  // ✅ SPLIT DATA CORRECTLY
  const featured = products.slice(0,4);
  const trending = products.slice(4,10);
  const shop = products.slice(10);

  // ✅ STORE ONLY SHOP
  window.__shopProducts = shop;

  render("featuredProducts", featured);
  render("trendingProducts", trending);
  render("products", shop);

  setupFilters();

});
