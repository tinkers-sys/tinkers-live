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

  if (!res.ok) throw new Error("Failed to fetch");

  const data = await res.json();

  console.log("✅ DATA:", data); // Debug

  return data;
}

/* ===============================
✅ BUILD PRODUCT CARD
=============================== */
function buildCard(p) {

  let stockText = "";

  if (parseInt(p.stock) <= 0) {
    stockText = "<p style='color:red;'>Out of Stock</p>";
  } else if (parseInt(p.stock) <= 3) {
    stockText = "<p style='color:red;'>Only " + p.stock + " left 🔥</p>";
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

    for (let i = 0; i < products.length; i++) {
      html += buildCard(products[i]);
    }

    container.innerHTML = html;

    console.log("✅ PRODUCTS DISPLAYED");

  } catch (err) {

    console.error("ERROR:", err);

    container.innerHTML =
      "<p style='color:red;'>Failed to load products ❌</p>";
  }

});