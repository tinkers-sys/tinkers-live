"use strict";

const URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";

/* CART */
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

/* LOAD PRODUCTS */
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

/* ADD TO CART */
function addToCart(id){
  let cart = readCart();
  const item = cart.find(i => i.id===id);

  if(item) item.qty++;
  else cart.push({id, qty:1});

  writeCart(cart);
  updateCartCount();
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

/* RENDER */
function render(id, products){
  const el = document.getElementById(id);
  if(!el) return;

  el.innerHTML = products.map(buildCard).join("");
}

/* FILTER */
function setupFilters(products){
  document.querySelectorAll(".filters a").forEach(btn => {

    btn.onclick = (e)=>{
      e.preventDefault();

      const cat = btn.dataset.filter;
      const filtered = cat==="All"
        ? products
        : products.filter(p => p.category===cat);

      render("productsList", filtered);
    };

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

/* INIT */
document.addEventListener("DOMContentLoaded", async ()=>{

  const products = await loadProducts();

  updateCartCount();

  render("featuredProducts", products.slice(0,4));
  render("trendingProducts", products.slice(4,10));
  render("productsList", products.slice(10));

  setupFilters(products);

});

/* GLOBAL */
window.addToCart = addToCart;
``
