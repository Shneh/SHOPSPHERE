const API = "https://shopsphere-dgaa.onrender.com";

let cart = [];
window.onload = () => {
  loadProducts();
};

function loadProducts(search = "", sort = "name", order = "asc") {
  const query = `?search=${encodeURIComponent(search)}&sort=${sort}&order=${order}`;
  
  fetch(`${API}/products${query}`)
    .then(res => res.json())
    .then(products => {
      const container = document.getElementById("product-list");
      container.innerHTML = products.map(p => `
        <div class="product-card">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          <h4>${p.name}</h4>
          <p>Category: ${p.category}</p>
          <p>₹${p.price}</p>
          <button onclick="addItemToCart('${p.name}', ${p.price})">Add to Cart</button>
        </div>
      `).join("");
    })
    .catch(error => {
      console.error("Error loading products:", error);
    });
}

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
function loadProducts(search = "", sort = "name", order = "asc") {
  const query = `?search=${encodeURIComponent(search)}&sort=${sort}&order=${order}`;
  fetch(`${API}/products${query}`)
    .then(res => res.json())
    .then(products => {
      const container = document.getElementById("product-list");
      container.innerHTML = products.map(p => `
        <div class="product-card">
          <img src="${p.image}" alt="${p.name}">
          <h4>${p.name}</h4>
          <p>₹${p.price}</p>
          <p>${p.category}</p>
        </div>
      `).join("");
    });
}

document.getElementById("search-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const search = document.getElementById("search-input").value;
  const sort = document.getElementById("sort-by").value;
  const order = document.getElementById("sort-order").value;
  loadProducts(search, sort, order);
});

window.onload = () => loadProducts();


window.onload = () => {
  loadProducts();
};
function addItemToCart(name, price) {
  alert(`${name} (₹${price}) added to cart!`);
  // You can implement the real backend logic later
}
window.onload = () => {
  loadProducts();
};
function addItemToCart(name, price) {
  cart.push({ name, price });
  updateCart();
}
function updateCart() {
  const cartList = document.getElementById("cart-list");
  if (!cartList) return;

  cartList.innerHTML = cart.map(item => `
    <div>${item.name} - ₹${item.price}</div>
  `).join("");
}
