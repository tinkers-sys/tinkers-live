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
    category: (p.category || "").trim().toLowerCase(),
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
function render(id, products){
  const el = document.getElementById(id);
  if(!el) return;
  el.innerHTML = products.map(buildCard).join("");
}

/* ===============================
   FILTER ✅ FIXED
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
   CHECKOUT ✅ FIXED (THE MISSING PART)
================================ */
function renderCheckout(){

  const cartEl = document.getElementById("cart");
  const totalEl = document.getElementById("checkoutTotal");

  if(!cartEl || !totalEl) return;

  const cart = readCart();

  if(!cart.length){
    cartEl.innerHTML = "<p>Your cart is empty</p>";
    totalEl.textContent = "R0";
    return;
  }

  let total = 0;

  cartEl.innerHTML = "";

  cart.forEach(item => {

    const product = window.__products.find(p => p.id === item.id);
    if(!product) return;

    const subtotal = product.price * item.qty;
    total += subtotal;

    cartEl.innerHTML += `
      <div class="card">
        <img src="images/${product.image}">
        <h3>${product.name}</h3>
        <p>${item.qty} × R${product.price}</p>
        <p><strong>R${subtotal}</strong></p>
      </div>
    `;
  });

  totalEl.textContent = "R" + total;
}

/* ===============================
   INIT
================================ */
document.addEventListener("DOMContentLoaded", async ()=>{

  const products = await loadProducts();

  window.__products = products;

  updateCartCount();

  render("featuredProducts", products.slice(0,4));
  render("trendingProducts", products.slice(4,10));
  render("products", products);

  setupFilters(products);

  // ✅ LOAD CHECKOUT IF PRESENT
  renderCheckout();
});
``
