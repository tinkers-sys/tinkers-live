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

  if (stock <= 0) {
    stockText = "<p style='color:red;'>Out of Stock</p>";
  } else if (stock <= 3) {
    stockText = "<p style='color:red;'>Only " + stock + " left 🔥</p>";
  } else if (stock <= 5) {
    stockText = "<p style='color:orange;'>Low stock (" + stock + ")</p>";
  }

  return `
    <div style="border:1px solid #ccc; padding:10px; margin:10px;">
      <h3>${p.name}</h3>
      <p>${formatCurrency(p.price)}</p>
      ${stockText}
    </div>
  `;
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
