const API = "https://shopsphere-dgaa.onrender.com";
let cart = [];

function loadProducts() {
fetch(${API}/products)
.then((res) => res.json())
.then((products) => {
const productList = document.getElementById("product-list");
productList.innerHTML = ""; // Clear any existing content
products.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.classList.add("product-card");

    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}" />
      <h3>${product.name}</h3>
      <p>₹${product.price}</p>
      <button onclick="addItemToCart('${product.name.replace(/'/g, "\\'")}', ${product.price})">Add to Cart</button>
    `;

    productList.appendChild(productCard);
  });
})
.catch((err) => {
  console.error("Error fetching products:", err);
});
}

function addItemToCart(name, price) {
cart.push({ name, price });
updateCart();
}

function updateCart() {
const cartList = document.getElementById("cart-list");
if (!cartList) return;

cartList.innerHTML = cart.map(item => <div>${item.name} - ₹${item.price}</div> ).join("");
}

window.onload = () => {
loadProducts();
updateCart();
};