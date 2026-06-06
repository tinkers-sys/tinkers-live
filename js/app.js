"use strict";

const PRODUCTS_URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";

/* LOAD */
async function loadProducts(){
  const res = await fetch(PRODUCTS_URL);
  const data = await res.json();
  return data.map(p => ({
    ...p,
    id: String(p.id || p.ID),
    price: Number(p.price)
  }));
}

/* CARD */
function buildCard(p){
  return `
    <div class="card">
      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p class="price">R${p.price}</p>
      <button onclick="addToCart('${p.id}')">Add to cart</button>
    </div>
  `;
}

/* RENDER SECTION */
function render(id, products){
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = products.map(buildCard).join("");
}

/* FILTER */
function setupFilters(products){
  document.querySelectorAll(".filters a").forEach(btn=>{
    btn.onclick = (e)=>{
      e.preventDefault();
      const cat = btn.dataset.filter;
      const filtered = cat === "All"
        ? products
        : products.filter(p=>p.category === cat);
      render("products", filtered);
    }
  });
}

/* ANIMATION */
function animate(){
  document.querySelectorAll(".fade-in").forEach(el=>{
    if(el.getBoundingClientRect().top < window.innerHeight-100){
      el.classList.add("active");
    }
  });
}

window.addEventListener("scroll", animate);

/* CART */
function addToCart(id){
  let cart = JSON.parse(localStorage.getItem("cart")||"[]");
  const item = cart.find(i=>i.id===id);
  if(item) item.qty++;
  else cart.push({id, qty:1});
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* INIT */
document.addEventListener("DOMContentLoaded", async ()=>{

  const products = await loadProducts();

  const featured = products.slice(0,4);
  const trending = products.slice(4,10);
  const shop = products.slice(10);

  render("featuredProducts", featured);
  render("trendingProducts", trending);
  render("products", shop);

  setupFilters(products);
});
