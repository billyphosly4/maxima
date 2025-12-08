// Load and display cart items
document.addEventListener("DOMContentLoaded", loadCart);

function loadCart() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let container = document.getElementById("cart-items");
    container.innerHTML = "";

    if (cart.length === 0) {
        container.innerHTML = `<p class="empty">Your cart is empty 🛒 <a href="electronics.html">Shop now</a></p>`;
        document.getElementById("total").textContent = "Total: $0";
        return;
    }

    let total = 0;

    cart.forEach((item, index) => {
        total += item.price * item.qty;

        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p>Unit Price: $${item.price}</p>
                    <p>Quantity: ${item.qty}</p>
                </div>

                <div class="item-controls">
                    <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                    <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                    <br><br>
                    <button onclick="removeItem(${index})"
                      style="background:blue;color:white;border-radius:10px;">Remove</button>
                </div>
            </div>
        `;
    });

    document.getElementById("total").textContent = `Total: $${total}`;
}


// Update quantity (+ or -)
function updateQty(index, change) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    cart[index].qty += change;

    if (cart[index].qty <= 0) {
        cart.splice(index, 1);  // remove item
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// Remove item fully
function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// Clear all
function clearCart() {
    localStorage.removeItem("cart");
    loadCart();
}
