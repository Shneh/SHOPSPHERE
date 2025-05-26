const API = "https://shopsphere-dgaa.onrender.com";


let cart = [];

function loadProducts(search = "", sort = "name", order = "asc") {
  const query = `?search=${encodeURIComponent(search)}&sort=${sort}&order=${order}`;
  
  fetch(`${API}/products${query}`)
    .then(res => res.json())
    .then(products => {
      // Optional: sort on client-side if API doesn't do it
      if (sort === "price") {
        products.sort((a, b) => order === "asc" ? a.price - b.price : b.price - a.price);
      } else if (sort === "name") {
        products.sort((a, b) => order === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name));
      }

      const container = document.getElementById("product-list");
      container.innerHTML = products.map(p => `
        <div class="product-card">
          <img src="${p.image}" alt="${p.name}">
          <h3>${p.name}</h3>
          <p>₹${p.price}</p>
          <button onclick="addItemToCart('${p.name}', ${p.price})">Add to Cart</button>
        </div>
      `).join("");
    })
    .catch(error => {
      console.error("Error loading products:", error);
    });
}
document.getElementById("search-form").addEventListener("submit", function (e) {
  e.preventDefault();
  
  const search = document.getElementById("search-input").value;
  const sort = document.getElementById("sort-by").value;
  const order = document.getElementById("sort-order").value;
  
  loadProducts(search, sort, order);
});
document.getElementById("sort-by").addEventListener("change", () => {
  document.getElementById("search-form").dispatchEvent(new Event("submit"));
});

document.getElementById("sort-order").addEventListener("change", () => {
  document.getElementById("search-form").dispatchEvent(new Event("submit"));
});


function addItemToCart(name, price) {
  const existingItem = cart.find(item => item.name === name);

  if (existingItem) {
    existingItem.quantity += 1; // Increase the quantity
    existingItem.price = price * existingItem.quantity; // Update the price with new quantity
  } else {
    cart.push({ name, price, quantity: 1 }); // Add new item with quantity 1
  }

  updateCart();
  showToast(`${name} added to cart!`);
}


function showToast(message) {
  const toast = document.getElementById("cart-toast");
  toast.textContent = message;
  toast.classList.add("show");

  // Auto-hide after 2.5 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    toast.style.display = "none";
  }, 2500);

  toast.style.display = "block";
}
function updateCart() {
  const cartList = document.getElementById("cart-list");
  const cartTotal = document.getElementById("cart-total");

  if (!cartList || !cartTotal) return;

  cartList.innerHTML = cart.map(item => `
    <div>${item.name} x ${item.quantity} - ₹${item.price}</div>
  `).join("");

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  cartTotal.textContent = `🧾 Total: ₹${totalPrice} for ${totalItems} item(s)`;
}

function handleCheckout() {
  if (cart.length === 0) {
    alert("🛒 Your cart is empty!");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  alert(`✅ Thank you! Your order of ₹${total} has been placed.`);

  cart = []; // Clear cart
  updateCart();
}

function removeItem(name) {
  cart = cart.filter(item => item.name !== name); // Remove item by name
  updateCart();
}
function updateCart() {
  const cartList = document.getElementById("cart-list");
  const cartTotal = document.getElementById("cart-total");

  if (!cartList || !cartTotal) return;

  if (cart.length === 0) {
    cartList.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = "Total: ₹0";
    return;
  }

  let total = 0;

  cartList.innerHTML = cart.map(item => {
    total += item.price;
    return `
      <div class="cart-item">
        <span>${item.name}</span> 
        <span>₹${item.price} (x${item.quantity})</span>
        <button onclick="removeItem('${item.name}')">Remove</button>
      </div>
    `;
  }).join("");

  cartTotal.textContent = `Total: ₹${total.toFixed(2)}`;

  // Save cart to LocalStorage
  localStorage.setItem("cart", JSON.stringify(cart));
}



window.onload = function () {
  loadProducts();
  updateCart();

  const checkoutBtn = document.getElementById("checkout-button");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", handleCheckout);
  }

};
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("login-toggle");
  const popup = document.getElementById("login-popup");

  if (toggleBtn && popup) {
    toggleBtn.addEventListener("click", () => {
      popup.classList.toggle("hidden");
    });
  }
});





function spinWheel() {
    const rewards = [5, 10, 15, 0]; // % discount
    const random = rewards[Math.floor(Math.random() * rewards.length)];
  
    document.getElementById("spin-result").innerHTML = 
      random > 0 ? `🎉 You won ${random}% off your order!` 
                 : "😅 No luck this time. Try again!";
  }
function loadRecommendations() {
    fetch(`${API}/recommend`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("recommendations").innerHTML = 
          "We think you'll like: " + data.join(", ");
      });
}
function shareCart() {
    const shareText = "Check out my cart at ShopSphere! 🛒";
    const url = encodeURIComponent("http://localhost:8000");
  
    const whatsappURL = `https://api.whatsapp.com/send?text=${shareText} ${url}`;
    window.open(whatsappURL, "_blank");
}
  
function addItem() {
  fetch(`${API}/products`)
    .then(res => res.json())
    .then(products => {
      if (products.length === 0) return;

      const randomIndex = Math.floor(Math.random() * products.length);
      const randomProduct = products[randomIndex];

      addItemToCart(randomProduct.name, randomProduct.price);
    })
    .catch(err => {
      console.error("Failed to fetch products:", err);
    });
}


  fetch(`${API}/add_to_cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(item)
  })
  .then(res => res.json())
  .then(data => {
    alert("Item added!");
    loadCart();
  });


function loadCart() {
  fetch(`${API}/get_cart`)
    .then(res => res.json())
    .then(cart => {
      const cartList = document.getElementById("cart-list");
      cartList.innerHTML = cart.map(item => `<p>${item.name} - ₹${item.price}</p>`).join("");
    });
}

function applyDiscount() {
  fetch(`${API}/get_cart`)
    .then(res => res.json())
    .then(cart => {
      const total = cart.reduce((sum, item) => sum + item.price, 0);

      fetch(`${API}/apply_discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ total })
      })
      .then(res => res.json())
      .then(data => {
        const result = `
          Original: ₹${data.original} <br>
          Discount: ₹${data.discount} <br>
          Final: ₹${data.final}
        `;
        document.getElementById("discount-result").innerHTML = result;
      });
    });
}



function sortProducts(products, sortBy) {
  if (sortBy === "price-asc") {
    return products.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    return products.sort((a, b) => b.price - a.price);
  } else if (sortBy === "name-asc") {
    return products.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === "name-desc") {
    return products.sort((a, b) => b.name.localeCompare(a.name));
  }
  return products;
}

function handleCheckout() {
  if (cart.length === 0) {
    alert("🛒 Your cart is empty!");
    return;
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  fetch(`${API}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart, total })
  })
  .then(res => res.json())
  .then(data => {
    console.log(data.message);
    alert("✅ Order placed! Thank you for shopping.");
    cart = [];
    updateCart();
  })
  .catch(err => {
    console.error("❌ Order failed:", err);
    alert("Something went wrong. Please try again.");
  });
}
function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  fetch(`${API}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cart })
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("order-status").innerText = "✅ Order placed successfully!";
    cart = [];
    updateCart();
  })
  .catch(err => {
    console.error("Checkout failed", err);
    document.getElementById("order-status").innerText = "❌ Failed to place order.";
  });
}
function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      document.getElementById("login-status").innerText =
        data.message || data.error;
      if (data.message) {
        localStorage.setItem("user", username);
      }
    });
}
