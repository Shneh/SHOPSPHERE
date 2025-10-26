-- shopsphere schema (sql/schema.sql)

CREATE DATABASE IF NOT EXISTS shopsphere;
USE shopsphere;

-- USERS: customer / retailer / admin
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255), -- plaintext as requested (insecure)
  role ENUM('customer','retailer','admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS: added by retailer
CREATE TABLE products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  retailer_id INT,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  stock INT DEFAULT 0,
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (retailer_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ORDERS
CREATE TABLE orders (
  order_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  total DECIMAL(10,2),
  status ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- ORDER ITEMS
CREATE TABLE order_items (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT,
  product_id INT,
  quantity INT,
  price DECIMAL(10,2),
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE SET NULL
);

-- SIMPLE RECOMMENDATION LOG: we'll keep product views to base simple recommendations
CREATE TABLE product_views (
  view_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT,
  user_id INT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);