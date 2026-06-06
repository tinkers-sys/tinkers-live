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
}

/* ===============================
   CARD
================================ */
function buildCard(p){
  return `
    <div class="card">
      <img src="images/${p.image}">
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
   FILTER ✅ FIXED LOGIC
================================ */
function setupFilters(products){

  const featured = document.querySelector(".featured");
  const trending = document.querySelector(".trending");
  const title = document.getElementById("sectionTitle");

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", e=>{
      e.preventDefault();

      const cat = btn.dataset.filter;

      if(cat === "All"){
        render("products", products.slice(10));
        featured.style.display = "block";
        trending.style.display = "block";
        title.innerText = "Our Collection";

      } else {
        const filtered = products.filter(p =>
          p.category &&
          p.category.trim().toLowerCase() === cat.toLowerCase()
        );

        render("products", filtered);

        featured.style.display = "none";
        trending.style.display = "none";

        title.innerText = "Showing: " + cat;
      }

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
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async ()=>{

  const products = await loadProducts();

  updateCartCount();

  render("featuredProducts", products.slice(0,4));
  render("trendingProducts", products.slice(4,10));
  render("products", products.slice(10));

  setupFilters(products);

});
