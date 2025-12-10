// Load cart items from localStorage
function loadCart() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const cartItemsContainer = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");
    const totalPriceElement = document.getElementById("total-price");

    cartItemsContainer.innerHTML = "";
    cartCount.textContent = cart.length;

    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;

        const div = document.createElement("div");
        div.classList.add("cart-item");

        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div style="flex: 1;">
                <h3>${item.name}</h3>
                <p>Price: $${item.price}</p>
            </div>
            <div class="cart-actions">
                <button onclick="removeItem(${index})">Remove</button>
            </div>
        `;

        cartItemsContainer.appendChild(div);
    });

    totalPriceElement.textContent = total;
}

// Remove item by index
function removeItem(index) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    loadCart();
}

// Clear entire cart
document.getElementById("clear-cart").addEventListener("click", () => {
    localStorage.removeItem("cart");
    loadCart();
});

// Load cart on page start
document.addEventListener("DOMContentLoaded", loadCart);
