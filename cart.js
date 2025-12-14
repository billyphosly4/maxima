// ================= CART STORAGE =================
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* 🔧 FIX OLD CART ITEMS (VERY IMPORTANT) */
cart = cart.map(item => {
  const fixedQty = Number(item.qty ?? item.quantity ?? 1);
  const fixedPrice = Number(item.price) || 0; // ✅ FIX PRICE

  return {
    ...item,
    price: fixedPrice,        // ✅ ensure numeric price
    quantity: fixedQty,
    qty: fixedQty
  };
});

// Save fixed cart back
localStorage.setItem("cart", JSON.stringify(cart));

// ================= UPDATE CART COUNT =================
function updateCartCount() {
  const cartCount = document.getElementById("cart-count");
  if (!cartCount) return;

  const totalItems = cart.reduce(
    (sum, item) => sum + Number(item.quantity || 0), // ✅ safe number
    0
  );

  cartCount.textContent = totalItems;
}

// ================= ADD TO CART FUNCTION =================
function addToCart(product) {
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += 1;
    existingItem.qty += 1;
  } else {
    cart.push({
      ...product,
      price: Number(product.price) || 0, // ✅ ensure price
      quantity: 1,
      qty: 1
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
}

// ================= MODAL ADD TO CART ONLY =================
document.addEventListener("click", e => {
  const btn = e.target;

  if (btn.id === "modal-add-to-cart") {
    const product = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: Number(btn.dataset.price) || 0, // ✅ FIX
      image: btn.dataset.image
    };

    addToCart(product);

    btn.textContent = "Added";
    btn.classList.add("added");
  }
});

// ================= INIT =================
updateCartCount();
