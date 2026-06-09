"use strict";

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR'
  }).format(amount);
}

let cart = JSON.parse(localStorage.getItem("cart")) || [];

async function loadProducts() {
  const res = await fetch("https://opensheet.elk.sh/1ObeXTE1sUyh5yXuGL4EV34fn1BM_bfSzzMuI7WiLASc/Sheet1");

  if (!res.ok) throw new Error("Fail");

  const data = await res.json();

  return data.map(p => ({
    id: p.id,
    name: p.name,
    price: parseFloat(p.price),
    image: p.image,
    category: p.category.toLowerCase(),
    stock: parseInt(p.stock)
  }));
}

function buildCard(p) {
  return `
    <div class="product-card">
      <img src="images/${p.image}">
      <h3>${p.name}</h3>
      <p>${formatCurrency(p.price)}</p>
      <button onclick="alert('Works ✅')">Test Button</button>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {

  try {
    const container = document.getElementById("products");
    const products = await loadProducts();

    container.innerHTML = products.map(buildCard).join("");

  } catch (err) {
    console.error(err);
    document.getElementById("products").innerHTML =
      "<p style='color:red;'>Still broken ❌</p>";
  }

});
