const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const morgan = require('morgan'); // ✅ add morgan here
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined')); // ✅ logs all incoming API requests

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Test DB connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('DB connection failed:', err);
  } else {
    console.log('DB connected successfully');
    connection.release();
  }
});

// Signup endpoint
app.post('/signup', (req, res) => {
  console.log('Incoming request:', req.method, req.url, req.body); // ✅ optional extra log
  const { username, email, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [email, username],
    (err, result) => {
      if (err) return res.status(500).send('Database error');
      if (result.length > 0) return res.send('User already exists');

      db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, password],
        (err2) => {
          if (err2) return res.status(500).send('Database error');
          res.send(`Account created! Your credentials:\nUsername: ${username}\nEmail: ${email}`);
        }
      );
    }
  );
});

// Login endpoint
app.post('/login', (req, res) => {
  console.log('Incoming request:', req.method, req.url, req.body); // ✅ optional extra log
  const { emailOrUsername, password } = req.body;
  db.query(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [emailOrUsername, emailOrUsername],
    (err, result) => {
      if (err) return res.status(500).send('Database error');
      if (result.length === 0) return res.send('User does not exist');

      if (result[0].password === password) {
        res.send('Login successful!');
      } else {
        res.send('Wrong password');
      }
    }
  );
});

app.listen(5000, () => console.log('Backend running on port 5000'));