let cart = [];

function addToCart(productName, productPrice) {
    // Add the product to the cart array
    cart.push({ name: productName, price: productPrice });
    updateCart();
}


function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const totalPrice = document.getElementById('total-price');

    // Clear the existing list
    cartItems.innerHTML = '';

    let total = 0;

    // Create a list item for each product in the cart
    cart.forEach((item) => {
        const li = document.createElement('li');
        li.textContent = `${item.name} - $${item.price.toFixed(2)}`;
        cartItems.appendChild(li);
        total += item.price;
    });

    // Update the total price
    totalPrice.textContent = total.toFixed(2);
}

function clearCart() {
    cart = [];
    updateCart();
}
