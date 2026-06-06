"use strict";

const URL = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";

/* ===============================
   CART SYSTEM
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

  const total = readCart().reduce((sum, item) => sum + item.qty, 0);
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
  else cart.push({ id, qty:1 });

  writeCart(cart);
  updateCartCount();
}

/* ===============================
   PRODUCT CARD
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
   RENDER FUNCTION
================================ */
function render(targetId, products){
  const el = document.getElementById(targetId);
  if(!el) return;

  el.innerHTML = products.map(buildCard).join("");
}

/* ===============================
   FILTER FUNCTION ✅ FINAL FIX
================================ */
function setupFilters(products){

  document.querySelectorAll(".filters a").forEach(btn => {

    btn.addEventListener("click", function(e){
      e.preventDefault();

      const category = this.dataset.filter.toLowerCase();

      let filtered;

      if(category === "all"){
        filtered = products;
      } else {
        filtered = products.filter(p =>
          p.category.toLowerCase() === category
        );
      }

      render("products", filtered);

      // ✅ update heading
      const title = document.getElementById("sectionTitle");
      title.innerText = category === "all"
        ? "Our Collection"
        : "Showing: " + category;

      // ✅ active button styling
      document.querySelectorAll(".filters a").forEach(b => b.classList.remove("active"));
      this.classList.add("active");

    });

  });
}

/* ===============================
   CLICK HANDLER (SAFE)
================================ */
document.addEventListener("click", function(e){
  if(e.target.classList.contains("add-btn")){
    const id = e.target.dataset.id;
    addToCart(id);
  }
});

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async ()=>{

  const products = await loadProducts();

  updateCartCount();

  // ✅ INITIAL SECTIONS
  render("featuredProducts", products.slice(0,4));
  render("trendingProducts", products.slice(4,10));
  render("products", products);

  setupFilters(products);

});
