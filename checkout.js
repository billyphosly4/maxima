document.addEventListener("DOMContentLoaded", () => {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const checkoutItems = document.getElementById("checkout-items");
  const checkoutTotal = document.getElementById("checkout-total");

  function loadCheckout() {
    checkoutItems.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} x${item.quantity} — $${item.price * item.quantity}`;
      checkoutItems.appendChild(li);

      total += item.price * item.quantity;
    });

    checkoutTotal.textContent = total.toFixed(2);
  }

  loadCheckout();

  // PLACE ORDER BUTTON
  document.getElementById("place-order").addEventListener("click", () => {
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const msg = document.getElementById("order-message");

    if (!name || !phone || !address) {
      msg.style.color = "red";
      msg.textContent = "Please fill in all fields.";
      return;
    }

    if (cart.length === 0) {
      msg.style.color = "red";
      msg.textContent = "Your cart is empty!";
      return;
    }

    // Simulate checkout success
    msg.style.color = "green";
    msg.textContent = "Order placed successfully!";

    // Clear cart
    localStorage.removeItem("cart");

    // Optional redirect after 2 seconds:
    setTimeout(() => {
      window.location.href = "index.html";
    }, 2000);
  });
});

