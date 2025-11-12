// ===== main.js =====

document.addEventListener("DOMContentLoaded", () => {
  // Load cart from localStorage or initialize empty
  let cart = JSON.parse(localStorage.getItem("universalCart")) || [];

  // DOM elements
  const cartContainer = document.getElementById("cardContainer");
  const totalPriceE1 = document.getElementById("totalPrice");
  const clearCartBtn = document.getElementById("clearCart");
  const searchInput = document.querySelector('.search-bar input');
  const products = document.querySelectorAll('.product-card');
  const cartCountSpan = document.getElementById("cart-count");

  // ===== CART FUNCTIONS =====
  function displayCart() {
    if (!cartContainer) return;

    if (cart.length === 0) {
      cartContainer.innerHTML = "<p>Your cart is empty 🛒, <span><a href='index.html'>Shop now</a></span></p>";
      totalPriceE1.textContent = "";
    } else {
      cartContainer.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        return `
          <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="card-details">
              <h3>${item.name}</h3>
              <p>Price: $${item.price.toFixed(2)}</p>
              <div class="quantity-control">
                <button onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, ${item.quantity + 1})">+</button>
              </div>
              <p class="item-total">Item Total: $${itemTotal.toFixed(2)}</p>
              <button class="remove-btn" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
          </div>
        `;
      }).join("");

      const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      totalPriceE1.textContent = `Total: $${total.toFixed(2)}`;
    }

    localStorage.setItem("universalCart", JSON.stringify(cart));
    updateCartCount();
  }

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.quantity += 1;
  else cart.push({...product, quantity: 1});

  displayCart();
  localStorage.setItem("universalCart", JSON.stringify(cart));

  // Show alert
  showCartAlert(`${product.name} added to cart!`, 2000);
}


  function updateQuantity(id, newQty) {
    const item = cart.find(i => i.id === id);
    if (item) {
      item.quantity = Math.max(1, newQty);
      displayCart();
    }
  }

  function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    displayCart();
  }

  clearCartBtn?.addEventListener("click", () => {
    cart = [];
    displayCart();
    localStorage.setItem("universalCart", JSON.stringify(cart));
  });

  // ===== CART COUNT FUNCTION =====
  function updateCartCount() {
    if (!cartCountSpan) return;
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = totalCount;
  }

  updateCartCount(); // initialize count

  // ===== SEARCH FUNCTIONALITY =====
  searchInput?.addEventListener("input", () => {
    const searchText = searchInput.value.toLowerCase();
    products.forEach(product => {
      const productName = product.querySelector("h2").textContent.toLowerCase();
      product.style.display = productName.includes(searchText) ? "block" : "none";
    });
  });

  // ===== EXPOSE FUNCTIONS GLOBALLY FOR INLINE HTML =====
  window.addToCart = addToCart;
  window.updateQuantity = updateQuantity;
  window.removeFromCart = removeFromCart;

  // ===== INITIALIZE CART DISPLAY =====
  displayCart();
});


// ===== ALERT FUNCTION =====
function showCartAlert(message, duration = 2000) {
  const alertDiv = document.getElementById("cart-alert");
  if (!alertDiv) return;

  alertDiv.textContent = message;
  alertDiv.classList.add("show");

  // Remove the alert after `duration` milliseconds
  setTimeout(() => {
    alertDiv.classList.remove("show");
  }, duration);
}
