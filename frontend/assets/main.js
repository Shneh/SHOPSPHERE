const API = "https://shopsphere-dgaa.onrender.com";


let cart = [];

function loadProducts(query = "") {
  fetch(`${API}/products`)
    .then(response => response.json())
    .then(products => {
      // Apply search filter
      products = searchProducts(products, query);

      const productList = document.getElementById("product-list");
      productList.innerHTML = ""; // Clear existing products

      products.forEach(product => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");

        productCard.innerHTML = `
          <img src="${product.image}" alt="${product.name}" />
          <h3>${product.name}</h3>
          <p>₹${product.price}</p>
          <button onclick="addItemToCart('${product.name}', ${product.price})">Add to Cart</button>
        `;

        productList.appendChild(productCard);
      });
    })
    .catch(error => console.error("Error loading products:", error));
}

// Call loadProducts() with search query
document.getElementById("search-input").addEventListener("input", (e) => {
  loadProducts(e.target.value); // Pass the search query
});


function loadProducts(sortBy = "") {
  fetch(`${API}/products`)
    .then(response => response.json())
    .then(products => {
      // Apply sorting
      products = sortProducts(products, sortBy);
      
      const productList = document.getElementById("product-list");
      productList.innerHTML = ""; // Clear existing products

      products.forEach(product => {
        const productCard = document.createElement("div");
        productCard.classList.add("product-card");

        productCard.innerHTML = `
          <img src="${product.image}" alt="${product.name}" />
          <h3>${product.name}</h3>
          <p>₹${product.price}</p>
          <button onclick="addItemToCart('${product.name}', ${product.price})">Add to Cart</button>
        `;

        productList.appendChild(productCard);
      });
    })
    .catch(error => console.error("Error loading products:", error));
}

// Call loadProducts() with sorting
document.getElementById("sort-options").addEventListener("change", (e) => {
  loadProducts(e.target.value); // Pass the sorting option
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



window.onload = () => {
  loadProducts();
  updateCart();
};





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

window.onload = loadCart;

document.getElementById("search-form").addEventListener("submit", function (e) {
  e.preventDefault();
  
  const search = document.getElementById("search-input").value;
  const sort = document.getElementById("sort-by").value;
  const order = document.getElementById("sort-order").value;
  
  loadProducts(search, sort, order);
});

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


window.onload = () => loadProducts();
function searchProducts(products, query) {
  return products.filter(product => product.name.toLowerCase().includes(query.toLowerCase()));
}
