// Load cart items on cart page
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  loadCartItems();
});


// Load cart items into cart.html
function loadCartItems() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const cartItemsDiv = document.getElementById("cart-items");

  if (cart.length === 0) {
    cartItemsDiv.innerHTML = `<p class="empty">Your cart is empty.</p>`;
    return;
  }

  cartItemsDiv.innerHTML = "";

  cart.forEach((item, index) => {
    const html = `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-details">
          <h3>${item.name}</h3>
          <p>Price: $${item.price}</p>
        </div>
        <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
      </div>
    `;

    cartItemsDiv.innerHTML += html;
  });
}


// Remove a single item
function removeItem(index) {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));

  updateCartCount();
  loadCartItems();
}


// Clear entire cart
function clearCart() {
  localStorage.removeItem("cart");
  updateCartCount();
  loadCartItems();
}


// Update cart bubble count (works on all pages)
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const countElement = document.getElementById("cart-count");

  if (countElement) {
    countElement.textContent = cart.length;
  }
}
