
// ------------------------------------------
// CART SYSTEM — WORKS ON ALL PAGES
// ------------------------------------------

let cart = JSON.parse(localStorage.getItem("cart")) || [];


// ------------------------------------------
// Update the small cart count in navbar
// ------------------------------------------
function updateCartCount() {
  const cartCountElement = document.getElementById("cart-count");
  if (cartCountElement) {
    let totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalQty;
  }
}
updateCartCount();


// ------------------------------------------
// ADD TO CART (from kitchen.html or any product page)
// ------------------------------------------
document.querySelectorAll(".add-to-cart").forEach(button => {
  button.addEventListener("click", function () {
    const id = this.dataset.id;
    const name = this.dataset.name;
    const price = Number(this.dataset.price);
    const image = this.dataset.image;

    let existing = cart.find(item => item.id === id);

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id,
        name,
        price,
        image,
        quantity: 1
      });

      // change button style
      this.textContent = "Added ✓";
      this.classList.add("added");
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
  });
});


// ------------------------------------------
// LOAD ITEMS ON cart.html
// ------------------------------------------
function loadCartItems() {
  const container = document.getElementById("cart-items");
  if (!container) return; // only run on cart.html

  container.innerHTML = "";

  if (cart.length === 0) {
    container.innerHTML = `<p style="text-align:center;font-size:20px;color:gray;">Your cart is empty .  <a href="kitchen.html">Shop Now</a> </p>`;
    document.getElementById("total-price").textContent = "";
    return;
  }

  let total = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const div = document.createElement("div");
    div.classList.add("cart-item");

    div.innerHTML = `
      <img src="${item.image}" style="width:100px;height:100px;border-radius:10px;">
      <div class="cart-info">
        <h3>${item.name}</h3>
        <p>Price: $${item.price}</p>

        <div class="qty-controls">
          <button onclick="changeQty('${item.id}', -1)">−</button>
          <span>${item.quantity}</span>
          <button onclick="changeQty('${item.id}', 1)">+</button>
        </div>

        <button onclick="removeItem('${item.id}')" style="color:red;margin-top:5px;">
          Remove
        </button>
      </div>
    `;

    container.appendChild(div);
  });

  document.getElementById("total-price").textContent = "Total: $" + total;
}

loadCartItems();


// ------------------------------------------
// Change quantity
// ------------------------------------------
function changeQty(id, amount) {
  let item = cart.find(i => i.id === id);

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  loadCartItems();
}


// ------------------------------------------
// Remove an item completely
// ------------------------------------------
function removeItem(id) {
  cart = cart.filter(item => item.id !== id);

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  loadCartItems();
}


// ------------------------------------------
// CLEAR CART
// ------------------------------------------
function clearCart() {
  cart = [];
  localStorage.setItem("cart", JSON.stringify(cart));

  updateCartCount();
  loadCartItems();
}


// ------------------------------------------
// CHECKOUT — FULLY WORKING
// ------------------------------------------
function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty. Add items before checking out.");
    return;
  }

  let receipt = "🧾 RECEIPT\n------------------------------\n";
  let total = 0;

  cart.forEach(item => {
    let cost = item.quantity * item.price;
    total += cost;
    receipt += `${item.name} x${item.quantity} = $${cost}\n`;
  });

  receipt += "------------------------------\n";
  receipt += `TOTAL: $${total}\n\n`;
  receipt += "Thank you for shopping at Maximall!";

  alert(receipt);

  // clear after checkout
  cart = [];
  localStorage.setItem("cart", JSON.stringify(cart));

  updateCartCount();
  loadCartItems();
}


// Attach checkout if button exists
const checkoutButton = document.querySelector(".checkout-btn");
if (checkoutButton) {
  checkoutButton.addEventListener("click", checkout);
}
 
 
