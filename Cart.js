// Load cart contents on page load
document.addEventListener("DOMContentLoaded", () => {
    displayCart();
    updateCartCount();
});

/* ======================
      CART STORAGE
====================== */

function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

/* ======================
      DISPLAY CART
====================== */

function displayCart() {
    let cart = getCart();
    let container = document.getElementById("cart-items");
    let totalDisplay = document.getElementById("total");

    if (cart.length === 0) {
        container.innerHTML = `
            <p class="empty-cart">Your cart is empty.<br>
            <a href="kitchen.html">Shop now</a></p>`;
        totalDisplay.textContent = "Total: $0";
        return;
    }

    let html = "";
    let total = 0;

    cart.forEach((item, index) => {
        let qty = item.qty || 1;
        total += item.price * qty;

        html += `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">

            <div class="item-details">
                <h3>${item.name}</h3>
                <p>Price: $${item.price}</p>
            </div>

            <div class="qty-control">
                <button onclick="changeQty(${index}, -1)">-</button>
                <span>${qty}</span>
                <button onclick="changeQty(${index}, 1)">+</button>
            </div>

            <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
        </div>
        `;
    });

    container.innerHTML = html;
    totalDisplay.textContent = `Total: $${total}`;
}

/* ======================
   QUANTITY & REMOVE
====================== */

function changeQty(index, amount) {
    let cart = getCart();

    if (!cart[index].qty) cart[index].qty = 1;
    cart[index].qty += amount;

    if (cart[index].qty <= 0) {
        cart.splice(index, 1);
    }

    saveCart(cart);
    displayCart();
    updateCartCount();
}

function removeItem(index) {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    displayCart();
    updateCartCount();
}

/* ======================
      CLEAR CART
====================== */

function clearCart() {
    localStorage.removeItem("cart");
    displayCart();
    updateCartCount();
}

/* ======================
      CART COUNT
====================== */

function updateCartCount() {
    let cart = getCart();
    let count = cart.length;
    document.getElementById("cart-count").textContent = count;
}
