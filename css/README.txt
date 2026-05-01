<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tinkers | African Curio Shop</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
<header class="header">
  <h1>Tinkers - From our hands to your heart</h1>
  <nav>
    <a href="#products" data-filter="All">All</a>
    <a href="#products" data-filter="Art">Art</a>
    <a href="#products" data-filter="Apparel">Apparel</a>
    <a href="#products" data-filter="Beadwork">Beadwork</a>
    <a href="#products" data-filter="Accessories">Accessories</a>
    <a href="checkout.html" class="cart-link">Checkout</a>
  </nav>
</header>

<section class="hero" style="background-image: linear-gradient(rgba(36,51,58,0.78), rgba(36,51,58,0.78)), url('images/tinkers-theme.jpg');">
  <div class="hero-content">
    <h1>Artisanal African Treasures, Curated for You</h1>
    <p>
      Discover handcrafted African art, traditional apparel, beadwork and accessories —
      inspired by heritage and made to last.
    </p>
    <div class="hero-actions">
      <a href="#products" class="primary-btn">Shop the Collection</a>
      <a href="checkout.html" class="secondary-btn">View Cart</a>
    </div>
  </div>
</section>

<div class="hero-divider"></div>

<!-- Featured Original Art (auto-filled from products.json where type=original) -->
<section id="originalArt" class="featured-art" style="display:none"></section>

<section class="grid" id="products">
  <!-- Cards will be injected here from products.json -->
</section>

<div class="whatsapp-chat" onclick="openChat()">💬 WhatsApp Curator</div>

<script src="js/app.js"></script>
</body>
</html>
