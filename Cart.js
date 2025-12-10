// ===========================
// LOGIN CHECK
// ===========================
function isLoggedIn() {
    return localStorage.getItem("loggedInUser") !== null;
}

// ===========================
// LOAD CART
// ===========================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ===========================
// UPDATE CART COUNT
// ===========================
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const counter = document.getElementById("cart-count");

    if (counter) counter.textContent = count;
}
updateCartCount();

// ===========================
// SAVE CART
// ===========================
function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

// ===========================
// ADD TO CART
// ===========================
function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push(product);
    }

    saveCart();
}

// ===========================
// INITIALIZE ADD TO CART BUTTONS
// ===========================
document.addEventListener("DOMContentLoaded", () => {
    const buttons = document.querySelectorAll(".add-to-cart");

    buttons.forEach(button => {
        const productId = button.dataset.id;

        // Restore Button State if Already in Cart
        const inCart = cart.find(item => item.id === productId);
        if (inCart) {
            button.textContent = "Added to Cart";
            button.classList.add("added");
            button.disabled = true;
        }

        // Button Click Event
        button.addEventListener("click", () => {

            // ---------- LOGIN REQUIRED ----------
            if (!isLoggedIn()) {
                alert("You must log in first!");
                window.location.href = "login.html";
                return;
            }

            const product = {
                id: productId,
                name: button.dataset.name,
                price: Number(button.dataset.price),
                image: button.dataset.image,
                quantity: 1
            };

            addToCart(product);

            // Change Button State
            button.textContent = "Added to Cart";
            button.classList.add("added");
            button.disabled = true;
        });
    });
});
