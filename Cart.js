// Load and display cart items
document.addEventListener("DOMContentLoaded", () => {
    displayCart();
    updateCartCount();
});

// Get cart from localStorage
function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

// Display cart items
function displayCart() {
    let cart = getCart();
    let container = document.getElementById("cart-items");
    let totalDisplay = document.getElementById("total");

    if (cart.length === 0) {
        container.innerHTML = `<p class="empty-cart">Your cart is empty.
        <a href="kitchen.html">Shop now<a></p>`;
        totalDisplay.textContent = "Total: $0";
        return;
    }

    let html = "";
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * (item.qty || 1);

        html += `
        <div class="cart-item">
            <img src="${item.image}" alt="Product">
            
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>Price: $${item.price}</p>
            </div>

            <div class="qty-control">
                <button onclick="changeQty(${index}, -1)">-</button>
                <span>${item.qty || 1}</span>
                <button onclick="changeQty(${index}, 1)">+</button>
            </div>

            <button class="remove-btn" onclick="removeItem(${index})">Remove</button>
        </div>
        `;
    });

    container.innerHTML = html;
    totalDisplay.textContent = `Total: $${total}`;
}

// Change quantity
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

// Remove one item
function removeItem(index) {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    displayCart();
    updateCartCount();
}

// 🆕 CLEAR ENTIRE CART
function clearCart() {
    localStorage.removeItem("cart");  // Delete all cart data
    displayCart();                    // Refresh cart display
    updateCartCount();                // Reset count to 0
}

// Update cart count
function updateCartCount() {
    let cart = getCart();
    document.getElementById("cart-count").textContent = cart.length;
}
