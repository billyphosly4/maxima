const cartContainer = document.getElementById("cardContainer");
const totalPriceE1 = document.getElementById("totalPrice");
const clearCartBtn = document.getElementById("clearCart");

let cart = JSON.parse(localStorage.getItem("universalCart")) || [];

function displayCart() {
  if (cart.length === 0) {
    cartContainer.innerHTML = "<p>Your cart is empty 🛒, <span><a href='index.html'>Shop now</a></span></p>";
    totalPriceE1.textContent = "";
    return;
  }

  cartContainer.innerHTML = cart.map((item) => {
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
    })
    .join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  totalPriceE1.textContent = `Total: $${total.toFixed(2)}`;

  localStorage.setItem("universalCart", JSON.stringify(cart));
}

function updateQuantity(id, newQty) {
  const item = cart.find((i) => i.id === id);
  if (item) {
    item.quantity = Math.max(1, newQty);
    displayCart();
  }
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  displayCart();
}

clearCartBtn.addEventListener("click", () => {
  cart = [];
  localStorage.setItem("universalCart", JSON.stringify(cart));
  displayCart();
});

// ===== SEARCH BAR FUNCTIONALITY =====
const searchInput = document.querySelector('.search-bar input');
const products = document.querySelectorAll('.product-card');

searchInput.addEventListener('input', () => {
  const searchText = searchInput.value.toLowerCase();

  products.forEach(product => {
    const productName = product.querySelector('h2').textContent.toLowerCase();
    // Show or hide products based on search match
    if (productName.includes(searchText)) {
      product.style.display = 'block';
    } else {
      product.style.display = 'none';
    }
  });
});

displayCart();
