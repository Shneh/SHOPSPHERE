const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// DB connection config - we'll use .env later; fill values for now
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '1234567890',    // put your mysql root password
  database: 'shopsphere'
};

app.get('/', (req, res) => res.send('Shopsphere backend running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
