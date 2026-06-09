"use strict";

/* ===============================
✅ FORMAT
=============================== */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
}

/* ===============================
✅ LOAD PRODUCTS
=============================== */
async function loadProducts() {

  const res = await fetch("https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1");

  if (!res.ok) throw new Error("Fetch failed");

  return await res.json();
}

/* ===============================
✅ BUILD PRODUCT CARD
=============================== */
function buildCard(p) {

  let stockText = "";
  let stock = parseInt(p.stock) || 0;

  let disabled = "";

  if (stock <= 0) {
    stockText = "<p style='color:red;'>Out of Stock</p>";
    disabled = "disabled";
  } else if (stock <= 3) {
    stockText = "<p style='color:red;'>Only " + stock + " left 🔥</p>";
  } else if (stock <= 5) {
    stockText = "<p style='color:orange;'>Low stock (" + stock + ")</p>";
  }

  return `
    <div class="product-card" style="border:1px solid #ccc; padding:15px; margin:10px; border-radius:8px;">
      
      <img src="images/${p.image}" style="width:100%; height:200px; object-fit:cover;">
      
      <h3>${p.name}</h3>
      
      <p>${formatCurrency(p.price)}</p>

      ${stockText}

      <button onclick="addToCart('${p.id}','${p.name}',${p.price},'${p.image}',${stock})"
        ${disabled}
        style="padding:8px 12px; background:#ff6600; color:white; border:none; border-radius:5px; cursor:pointer;">
        Add to Cart
      </button>

    </div>
  `;
}
function addToCart(id, name) {
  alert(name + " added to cart ✅");
}


/* ===============================
✅ INIT
=============================== */
document.addEventListener("DOMContentLoaded", async function(){

  const container = document.getElementById("products");

  try {

    const products = await loadProducts();

    let html = "";

    for (let i = 0; i < products.length; i++) {   // ✅ correct <
      html += buildCard(products[i]);
    }

    container.innerHTML = html;

    console.log("✅ PRODUCTS DISPLAYED");

  } catch (err) {

    console.error(err);

    container.innerHTML =
      "<p style='color:red;'>Failed to load products ❌</p>";

  }

});
