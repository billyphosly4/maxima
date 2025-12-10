document.addEventListener("DOMContentLoaded", () => {
    loadOrderSummary();

    document.getElementById("checkout-form").addEventListener("submit", function(e) {
        e.preventDefault();
        placeOrder();
    });
});

function loadOrderSummary() {
    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    let summaryBox = document.getElementById("order-summary");

    summaryBox.innerHTML = "";
    let total = 0;

    if (cart.length === 0) {
        summaryBox.innerHTML = "<p>Your cart is empty.</p>";
        return;
    }

    // Display all items
    cart.forEach(item => {
        total += Number(item.price);

        summaryBox.innerHTML += `
        <div class="order-item">
            <strong>${item.name}</strong>
            <span>$${item.price}</span>
        </div>
        `;
    });

    summaryBox.innerHTML += `
        <div class="total">
            Total: $${total}
        </div>
    `;
}

function placeOrder() {
    let name = document.getElementById("name").value.trim();
    let phone = document.getElementById("phone").value.trim();
    let location = document.getElementById("location").value.trim();

    if (!name || !phone || !location) {
        alert("Please fill in all details.");
        return;
    }

    // Clear cart after order
    localStorage.removeItem("cart");

    // Show success message
    document.getElementById("success-box").innerHTML = `
      <p class="success-message">
        🎉 Order placed successfully!<br>
        Thank you, ${name}. Your items will be delivered to ${location}.
      </p>
    `;

    // Reset form
    document.getElementById("checkout-form").reset();
}
