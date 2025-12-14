// ================= CART STORAGE =================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// ================= UPDATE CART COUNT =================
function updateCartCount() {
  const cartCount = document.getElementById("cart-count");
  if (!cartCount) return;

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
}

// ================= ADD TO CART FUNCTION =================
function addToCart(product) {
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

// ================= MODAL ADD TO CART ONLY =================
document.addEventListener("click", e => {
  const btn = e.target;

  // ONLY modal button is allowed to add
  if (btn.id === "modal-add-to-cart") {
    const product = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: Number(btn.dataset.price),
      image: btn.dataset.image
    };

    addToCart(product);

    // UI feedback (modal only)
    btn.textContent = "Added";
    btn.classList.add("added");
  }
});

// ================= INIT =================
updateCartCount();
