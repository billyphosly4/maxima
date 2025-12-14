/* ==================================================
   CHECKOUT.JS
   - Displays cart items
   - Collects customer details
   - Redirects to mpesa.html for payment
   - Supports WhatsApp ordering
================================================== */

/* DOM ELEMENTS */
const cartItemsDiv = document.getElementById("cartItems");
const totalAmountSpan = document.getElementById("totalAmount");

/* LOAD CART FROM STORAGE */
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ==================================================
   LOAD CART ITEMS
================================================== */
function loadCart() {
  cartItemsDiv.innerHTML = "";

  if (!cart.length) {
    cartItemsDiv.innerHTML = "<p class='muted'>Your cart is empty</p>";
    totalAmountSpan.textContent = "0";
    return;
  }

  let total = 0;

  cart.forEach(item => {
    const subtotal = item.price * item.qty;
    total += subtotal;

    cartItemsDiv.innerHTML += `
      <div class="item">
        <div class="left">
          <img src="${item.image}" class="thumb" alt="${item.name}">
          <div>
            <strong>${item.name}</strong><br>
            <span class="muted">${item.qty} × KES ${item.price}</span>
          </div>
        </div>
        <strong>KES ${subtotal}</strong>
      </div>
    `;
  });

  totalAmountSpan.textContent = total;
}

/* INITIAL LOAD */
loadCart();

/* ==================================================
   PLACE ORDER → REDIRECT TO MPESA
================================================== */
window.placeOrder = function () {
  if (!cart.length) {
    alert("Your cart is empty");
    return;
  }

  const name = document.getElementById("customerName").value.trim();
  const phone = document.getElementById("customerPhone").value.trim();
  const address = document.getElementById("customerAddress").value.trim();

  if (!name || !phone) {
    alert("Please enter your full name and phone number");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const orderData = {
    checkoutId: "ORDER_" + Date.now(),
    customer: {
      name,
      phone,
      address
    },
    items: cart,
    total,
    status: "PENDING_PAYMENT",
    createdAt: new Date().toISOString()
  };

  /* SAVE FOR MPESA PAGE */
  localStorage.setItem("pendingOrder", JSON.stringify(orderData));

  /* REDIRECT */
  window.location.href = "mpesa.html";
};

/* ==================================================
   ORDER VIA WHATSAPP
================================================== */
window.orderViaWhatsApp = function () {
  if (!cart.length) {
    alert("Your cart is empty");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  let message = "🛒 *New Order*%0A%0A";

  cart.forEach(item => {
    message += `• ${item.name} (${item.qty}) - KES ${item.price * item.qty}%0A`;
  });

  message += `%0A*Total:* KES ${total}`;

  const whatsappNumber = "2547XXXXXXXX"; // CHANGE THIS
  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${message}`;

  window.open(whatsappURL, "_blank");
};
