const API = "http://127.0.0.1:5000";
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
  const item = {
    name: "Sneakers",
    price: 1200
  };

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
}

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
