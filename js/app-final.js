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

  var res = await fetch("https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1");

  if (!res.ok) throw new Error("Fetch failed");

  var data = await res.json();

  console.log("DATA:", data);

  var products = [];

  for (var i = 0; i < data.length; i++) {

    var p = data[i];

    products.push({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price),
      image: p.image,
      category: (p.category || "").toLowerCase(),
      stock: parseInt(p.stock)
    });

  }

  return products;
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

  return '<div class="product-card">' +
    '<img src="images/' + p.image + '">' +
    '<h3>' + p.name + '</h3>' +
    '<p>' + formatCurrency(p.price) + '</p>' +
    stockText +
    '<button onclick="addToCart(\'' + p.id + '\',\'' + p.name + '\',' + p.price + ',\'' + p.image + '\',' + p.stock + ')" ' + disabled + '>Add to cart</button>' +
    '</div>';
}

/* ===============================
✅ ADD TO CART
=============================== */
function addToCart(id, name, price, image, stock){

  var item = null;

  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === id) {
      item = cart[i];
      break;
    }
  }

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

  for (var i = 0; i < cart.length; i++) {
    total += cart[i].price * cart[i].qty;
    count += cart[i].qty;
  }

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

  for (var i = 0; i < buttons.length; i++) {

    buttons[i].addEventListener("click", function(e){
      e.preventDefault();

      var filter = this.dataset.filter;

      var filtered = [];

      if(filter === "all"){
        filtered = products;
      } else {
        for (var j = 0; j < products.length; j++) {
          if (products[j].category === filter) {
            filtered.push(products[j]);
          }
        }
      }

      var html = "";

      for (var k = 0; k < filtered.length; k++) {
        html += buildCard(filtered[k]);
      }

      document.getElementById("products").innerHTML = html;

    });

  }
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

    var html = "";
    for (var i = 0; i < products.length; i++) {
      html += buildCard(products[i]);
    }

    container.innerHTML = html;

    setupFilters(products);

    console.log("✅ PRODUCTS LOADED");

  } catch(err){

    console.error(err);

    document.getElementById("products").innerHTML =
      "<p style='color:red;'>Failed to load products ❌</p>";

  }

});
