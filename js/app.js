"use strict";

const BASE_PATH = location.pathname.includes("tinkers-live")
  ? "/tinkers-live"
  : "";

const PRODUCTS_URL = BASE_PATH + "/products.json";

const CART_KEY = "tinkers_cart_v1";
const WHATSAPP_NUMBER = "27682525454";

function loadProducts() {
  return fetch(PRODUCTS_URL, { cache: "no-store" })
    .then(res => res.json())
    .catch(() => []);
}

function renderProducts(products) {
  const grid = document.getElementById("products");
  if (!grid) return;

  grid.innerHTML = "";

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="images/${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p class="price">R${p.price}</p>
      <button onclick="addToCart('${p.id}')">Add to cart</button>
    `;

    grid.appendChild(card);
  });
}

function addToCart(id) {
  alert(id + " added to cart");
}

document.addEventListener("DOMContentLoaded", () => {
  loadProducts().then(renderProducts);
});
