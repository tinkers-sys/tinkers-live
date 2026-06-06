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
    category: p.category,
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

  console.log("✅ Added:", id);
}

/* ===============================
   CARD BUILDER ✅ FIXED IMAGE
================================ */
function buildCard(p){
  return `
    <div class="card">
      <img src="images/${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="price">R${p.price}</p>
      <button onclick="addToCart('${p.id}')">Add to cart</button>
    </div>
  `;
}

/* ===============================
   RENDER FUNCTIONS
================================ */
function render(id, products){
  const el = document.getElementById(id);
  if(!el) return;

  el.innerHTML = products.map(buildCard).join("");
}

/* ===============================
   FILTERS ✅ FIXED
================================ */
function setupFilters(products){

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", (e)=>{
      e.preventDefault();

      const cat = btn.dataset.filter;

      const filtered = cat === "All"
        ? products
        : products.filter(p => p.category === cat);

      render("products", filtered);

      // ✅ active button style
      document.querySelectorAll(".filters a").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });

  });

}

/* ===============================
   ANIMATION
================================ */
function animate(){
  document.querySelectorAll(".fade-in").forEach(el=>{
    if(el.getBoundingClientRect().top < window.innerHeight - 100){
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", animate);

/* ===============================
   INIT ✅ CLEAN + CORRECT
================================ */
document.addEventListener("DOMContentLoaded", async ()=>{

  const products = await loadProducts();

  updateCartCount();

  /* ✅ SPLIT PRODUCTS (NO DUPLICATION) */
  const featured = products.slice(0,4);
  const trending = products.slice(4,10);
  const shop = products.slice(10);

  render("featuredProducts", featured);
  render("trendingProducts", trending);
  render("products", shop);

  setupFilters(products);

});

/* ===============================
   GLOBAL
================================ */
window.addToCart = addToCart;
