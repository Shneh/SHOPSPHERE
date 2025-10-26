// --- IMPORTS ---
const express = require("express");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const cors = require("cors");

// --- APP SETUP ---
const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- MYSQL CONFIG ---
const dbConfig = {
  host: "localhost",
  user: "shopsphere",
  password: "1234567890",
  database: "shopsphere",
  port: 3308, // change to your XAMPP port if different
};

// --- HELPER FUNCTION ---
async function getConnection() {
  return mysql.createConnection(dbConfig);
}

// --- ROUTES ---

// ✅ Test route
app.get("/", (req, res) => res.send("✅ Shopsphere backend running"));

// ✅ Register route
app.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!email || !password || !role)
    return res.status(400).json({ message: "Missing fields" });

  try {
    const conn = await getConnection();
    await conn.execute(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, password, role]
    );
    await conn.end();
    res.json({ message: "✅ User registered successfully" });
  } catch (err) {
    console.error("❌ Error registering user:", err);
    res.status(500).json({ message: "Error registering user", error: err });
  }
});

// ✅ Login route
app.post("/login", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Missing credentials" });

  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT * FROM users WHERE email = ? AND password = ? AND role = ?",
      [email, password, role]
    );
    await conn.end();

    if (rows.length === 0)
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      message: "✅ Login successful",
      user: {
        id: rows[0].user_id,
        name: rows[0].full_name,
        role: rows[0].role,
      },
    });
  } catch (err) {
    console.error("❌ Error logging in:", err);
    res.status(500).json({ message: "Error logging in", error: err });
  }
});

// ✅ Add Product (Retailer)
app.post("/add-product", async (req, res) => {
  const { retailer_id, name, description, price, stock, image_url } = req.body;

  if (!retailer_id || !name || !price)
    return res.status(400).json({ message: "Missing required fields" });

  try {
    const conn = await getConnection();
    const query = `
      INSERT INTO products (retailer_id, name, description, price, stock, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const [result] = await conn.execute(query, [
      retailer_id,
      name,
      description || "",
      price,
      stock || 0,
      image_url || "",
    ]);
    await conn.end();

    res.status(201).json({
      message: "✅ Product added successfully",
      product_id: result.insertId,
    });
  } catch (err) {
    console.error("❌ Error adding product:", err);
    res.status(500).json({ message: "Error adding product", error: err });
  }
});

// ✅ Get all products
app.get("/products", async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute("SELECT * FROM products ORDER BY created_at DESC");
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching products:", err);
    res.status(500).json({ message: "Error fetching products", error: err });
  }
});

// ✅ Get products for a specific retailer
app.get("/retailer-products/:retailer_id", async (req, res) => {
  const { retailer_id } = req.params;

  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT * FROM products WHERE retailer_id = ? ORDER BY created_at DESC",
      [retailer_id]
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching retailer products:", err);
    res.status(500).json({ message: "Error fetching products", error: err });
  }
});

// ✅ Update a product
app.put("/product/:product_id", async (req, res) => {
  const { product_id } = req.params;
  const { name, description, price, stock, image_url } = req.body;

  try {
    const conn = await getConnection();
    const [result] = await conn.execute(
      "UPDATE products SET name=?, description=?, price=?, stock=?, image_url=? WHERE product_id=?",
      [name, description, price, stock, image_url, product_id]
    );
    await conn.end();

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product not found" });

    res.json({ message: "✅ Product updated successfully" });
  } catch (err) {
    console.error("❌ Error updating product:", err);
    res.status(500).json({ message: "Error updating product", error: err });
  }
});

// ✅ Delete a product
app.delete("/product/:product_id", async (req, res) => {
  const { product_id } = req.params;

  try {
    const conn = await getConnection();
    const [result] = await conn.execute("DELETE FROM products WHERE product_id = ?", [product_id]);
    await conn.end();

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Product not found" });

    res.json({ message: "✅ Product deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ message: "Error deleting product", error: err });
  }
});

// ✅ Get all users (Admin)
app.get("/users", async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT user_id, full_name, email, role FROM users ORDER BY user_id DESC"
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    res.status(500).json({ message: "Error fetching users", error: err });
  }
});

// ✅ Delete a user (Admin)
app.delete("/users/:user_id", async (req, res) => {
  const { user_id } = req.params;
  try {
    const conn = await getConnection();
    const [result] = await conn.execute("DELETE FROM users WHERE user_id = ?", [user_id]);
    await conn.end();
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "✅ User deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).json({ message: "Error deleting user", error: err });
  }
});

// --- START SERVER ---
const PORT = 5015;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
// --- Search products ---
app.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: "Missing search query" });

  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT * FROM products WHERE name LIKE ? OR description LIKE ?",
      [`%${query}%`, `%${query}%`]
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Error searching products:", err);
    res.status(500).json({ message: "Error searching products", error: err });
  }
});

// --- Recommended products (top 5 expensive products) ---
app.get("/recommendations", async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(
      "SELECT * FROM products ORDER BY price DESC LIMIT 5"
    );
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching recommendations:", err);
    res.status(500).json({ message: "Error fetching recommendations", error: err });
  }
});
