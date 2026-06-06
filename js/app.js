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
    category: (p.category || "").trim().toLowerCase(), // ✅ IMPORTANT FIX
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
  else cart.push({ id, qty:1 });

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
function render(targetId, products){
  const el = document.getElementById(targetId);
  if(!el) return;

  el.innerHTML = products.map(buildCard).join("");
}

/* ===============================
   FILTER ✅ PERFECT FIX
================================ */
function setupFilters(products){

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", function(e){
      e.preventDefault();

      const selected = this.dataset.filter.toLowerCase();

      let filtered;

      if(selected === "all"){
        filtered = products;
      } else {
        filtered = products.filter(p => p.category === selected);
      }

      render("products", filtered);

      const title = document.getElementById("sectionTitle");
      title.innerText = selected === "all"
        ? "Our Collection"
        : "Showing: " + this.dataset.filter;

      document.querySelectorAll(".filters a").forEach(a => a.classList.remove("active"));
      this.classList.add("active");

    });

  });

}

/* ===============================
   BUTTON HANDLER
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

  // ✅ ONLY FOR DISPLAY (not filtering logic)
  render("featuredProducts", products.slice(0,4));
  render("trendingProducts", products.slice(4,10));

  // ✅ MAIN SHOP (FULL DATASET)
  render("products", products);

  setupFilters(products);

});
