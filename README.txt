TINKERS E-COMMERCE SYSTEM
========================

Project Name:
Tinkers Live Store

Description: 
------------
Tinkers is a lightweight e-commerce web application designed to sell African handcrafted products,
apparel, beadwork, and accessories. The system runs entirely on frontend technologies and integrates
with PayFast for secure payment processing.

The application is optimized for simplicity, performance, and easy deployment using static hosting
(e.g., Cloudflare Pages, GitHub Pages).

--------------------------------------------------

CORE FEATURES:
--------------

1. Product Catalogue
   - Products loaded dynamically from Google Sheets API
   - Category filtering (Art, Apparel, Beadwork, Accessories)
   - Responsive product grid layout

2. Cart System
   - Add to cart functionality
   - Quantity controls (+ / -)
   - Real-time cart updates
   - Cart drawer UI

3. Checkout System
   - Checkout page with item summary
   - WhatsApp order option
   - PayFast payment integration

4. Payment Integration (PayFast)
   - Secure card payments via PayFast
   - Automatic redirect after payment
   - Order saved before payment processing

5. Order Processing
   - Order saved in localStorage (lastOrder)
   - Order history stored (orderHistory)
   - Receipt displayed on success page

6. Thank You Page
   - Displays order reference
   - Sends stock updates via Google Apps Script
   - Tracks purchase using Google Analytics

7. Order History Page
   - Displays all previous orders
   - Shows order date, items, and totals

8. WhatsApp Integration
   - Send order or receipt via WhatsApp
   - Quick customer support access

--------------------------------------------------

FOLDER STRUCTURE:
-----------------

/tinkers-live
│
├── index.html          (Main store page)
├── checkout.html       (Checkout page)
├── success.html        (Payment success receipt)
├── thank-you.html      (Post-payment processing page)
├── orders.html         (Order history page)
├── terms.html          (Terms and Conditions)
│
├── css/
│   ├── styles.css
│   └── additions.css
│
├── js/
│   └── app.js
│
├── images/
│
├── wrangler.jsonc      (Cloudflare deployment config)
└── README.txt

--------------------------------------------------

LOCAL STORAGE KEYS:
-------------------

cart           → Current cart items
lastOrder      → Most recent order
orderHistory   → All completed orders
lastReceipt    → WhatsApp receipt data

--------------------------------------------------

PAYMENT FLOW:
-------------

1. User adds products to cart
2. User proceeds to checkout
3. Checkout calls prepareOrder()
4. Order is saved in localStorage (lastOrder)
5. User is redirected to PayFast
6. Payment is processed
7. PayFast redirects to success.html
8. Receipt is displayed
9. Order is saved to orderHistory
10. Cart is cleared

--------------------------------------------------

IMPORTANT CONFIGURATION:
------------------------

✔ Update PayFast URLs:
  return_url → yourdomain.com/success.html
  cancel_url → yourdomain.com/cancel.html
  notify_url → yourdomain.com/notify.php

✔ Replace with your live domain when deploying

✔ Update WhatsApp number:
  Default: 27720912943

✔ Google Analytics:
  Measurement ID: G-5GFFP9FW2T

✔ Google Script (Stock Updates):
  Make sure your Apps Script URL is active

--------------------------------------------------

DEPLOYMENT:
-----------

Recommended platforms:
- Cloudflare Pages (preferred)
- GitHub Pages
- Netlify

Steps:
1. Upload project folder
2. Ensure public root is correct
3. Update domain in PayFast settings
4. Test using PayFast Sandbox
5. Go live

--------------------------------------------------

LIMITATIONS:
------------

- Uses localStorage (not secure for production-scale payments)
- No server-side payment verification
- No database (orders stored locally per browser)
- Not suitable for high-volume transactions

--------------------------------------------------

RECOMMENDED UPGRADES:
---------------------

For production-ready system:
✔ Add backend (Cloudflare Workers or Node API)
✔ Store orders in database (KV, Firebase, or SQL)
✔ Verify PayFast payments (notify_url processing)
✔ Add admin dashboard
✔ Add reporting (daily sales / revenue)
✔ Add customer profiles

--------------------------------------------------

AUTHOR:
-------

Tinkers Store System
Developed for African Curio Retail

--------------------------------------------------

END OF FILE
