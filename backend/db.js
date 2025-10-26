import mysql from 'mysql2';

// create connection pool
const db = mysql.createConnection({
  host: 'localhost',
  user: 'shopsphere',
  password: '1234567890',
  database: 'shopsphere',
  port: 3308
});

// connect and log status
db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err);
  } else {
    console.log('✅ Connected to MySQL database: shopsphere');
  }
});

export default db;
