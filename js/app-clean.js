"use strict";

/* ===============================
✅ FORMAT
=============================== */
function formatCurrency(amount) {
  var f = new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  });
  return f.format(amount);
}

/* ===============================
✅ CART
=============================== */
var cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ===============================
✅ LOAD PRODUCTS
=============================== */
async function loadProducts() {

  var url = "https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1";

  var res = await fetch(url);

  if (!res.ok) throw new Error("Failed to fetch");

  var data = await res.json();

  console.log("DATA:", data);

  return data.map(function(p) {
    return {
      id: p.id,
      name: p.name,
      price: parseFloat(p.price),
      image: p.image,
      category: (p.category || "").toLowerCase(),
      stock: parseInt(p.stock)
    };
  });
}

/* ===============================
✅ BUILD CARD
=============================== */
function buildCard(p) {

  var stockText = "";
  var disabled = "";

  if (p.stock <= 0) {
    stockText = "<p style='color:red;'>Out of Stock</p>";
    disabled = "disabled";
  } else if (p.stock <= 3) {
    stockText = "<p style='color:red;'>Only " + p.stock + " left 🔥</p>";
  } else if (p.stock <= 5) {
    stockText = "<p style='color:orange;'>Low stock (" + p.stock + ")</p>";
  }

  return `
    <div class="product-card">
      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p>${formatCurrency(p.price)}</p>
      ${stockText}
      <button onclick="addToCart('${p.id}','${p.name}',${p.price},'${p.image}',${p.stock})" ${disabled}>
        Add to cart
      </button>
    </div>
  `;
}

/* ===============================
✅ ADD TO CART
=============================== */
function addToCart(id, name, price, image, stock){

  var item = cart.find(function(i){ return i.id === id });

  if(item){
    if(item.qty >= stock){
      alert("Stock limit reached");
      return;
    }
    item.qty++;
  } else {
    cart.push({
      id:id,
      name:name,
      price:price,
      image:image,
      qty:1,
      stock:stock
    });
  }

  saveCart();
}

/* ===============================
✅ SAVE CART
=============================== */
function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
}

/* ===============================
✅ CART UI
=============================== */
function updateCartUI(){

  var total = 0;
  var count = 0;

  cart.forEach(function(i){
    total += i.price * i.qty;
    count += i.qty;
  });

  var badge = document.querySelector(".cart-count");
  if(badge) badge.innerText = count;

  var totalEl = document.getElementById("cartTotal");
  if(totalEl) totalEl.innerText = formatCurrency(total);
}

/* ===============================
✅ FILTERS
=============================== */
function setupFilters(products){

  var buttons = document.querySelectorAll("nav a[data-filter]");

  buttons.forEach(function(btn){

    btn.addEventListener("click", function(e){
      e.preventDefault();

      var filter = btn.dataset.filter;

      var filtered;

      if(filter === "all"){
        filtered = products;
      } else{
        filtered = products.filter(function(p){
          return p.category === filter;
        });
      }

      document.getElementById("products").innerHTML =
        filtered.map(buildCard).join("");

    });

  });
}

/* ===============================
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", async function(){

  try{

    updateCartUI();

    var container = document.getElementById("products");
    if(!container) return;

    var products = await loadProducts();

    container.innerHTML = products.map(buildCard).join("");

    setupFilters(products);

    console.log("✅ PRODUCTS LOADED");

  } catch(err){

    console.error(err);

    document.getElementById("products").innerHTML =
      "<p style='color:red;'>Failed to load products ❌</p>";

  }

});
