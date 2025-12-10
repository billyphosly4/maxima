document.addEventListener("DOMContentLoaded", () => {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const checkoutItemsContainer = document.getElementById("checkout-items");
  const checkoutTotalElement = document.getElementById("checkout-total");
  const whatsappBtn = document.getElementById("whatsapp-btn");

  function loadCheckout() {
    checkoutItemsContainer.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
      checkoutItemsContainer.innerHTML = "<p>Your cart is empty. <a href='kitchen.html'>Shop Now</a></p>";
      checkoutTotalElement.textContent = "0.00";
      whatsappBtn.style.display = "none";
      return;
    }

    cart.forEach(item => {
      const div = document.createElement("div");
      div.classList.add("checkout-item");

      div.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="checkout-item-info">
          <h3>${item.name}</h3>
          <p>Price: $${item.price}</p>
          <p>Quantity: ${item.quantity}</p>
        </div>
      `;
      checkoutItemsContainer.appendChild(div);

      total += item.price * item.quantity;
    });

    checkoutTotalElement.textContent = total.toFixed(2);
  }

  // WhatsApp order
  whatsappBtn.addEventListener("click", () => {
    if (cart.length === 0) return;

    let message = "Hello, I would like to place this order:\n\n";
    cart.forEach(item => {
      message += `${item.name} - $${item.price} x ${item.quantity}\n`;
    });
    message += `\nTotal: $${cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}`;

    const whatsappNumber = "+254 117345789"; // Replace with your WhatsApp number in international format
    const url = `https://wa.me/${+254117345789}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");
  });

  loadCheckout();
});

