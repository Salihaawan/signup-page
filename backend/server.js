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
  console.log('Incoming request:', req.method, req.url, req.body);

  const { username, email, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [email, username],
    (err, result) => {

      if (err) {
        console.error("SIGNUP_ERROR: Database error", err);
        return res.status(500).send('Database error');
      }

      if (result.length > 0) {
        console.error("SIGNUP_FAILED: User already exists", email);
        return res.send('User already exists');
      }

      db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, password],
        (err2) => {

          if (err2) {
            console.error("SIGNUP_ERROR: Insert failed", err2);
            return res.status(500).send('Database error');
          }

          console.log("SIGNUP_SUCCESS:", username);

          res.send(`Account created! Your credentials:\nUsername: ${username}\nEmail: ${email}`);
        }
      );
    }
  );
});

// Login endpoint
app.post('/login', (req, res) => {

  console.log('Incoming request:', req.method, req.url, req.body);

  const { emailOrUsername, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [emailOrUsername, emailOrUsername],
    (err, result) => {

      if (err) {
        console.error("LOGIN_ERROR: Database error", err);
        return res.status(500).send('Database error');
      }

      if (result.length === 0) {
        console.error("LOGIN_FAILED: User does not exist", emailOrUsername);
        return res.send('User does not exist');
      }

      if (result[0].password === password) {

        console.log("LOGIN_SUCCESS:", emailOrUsername);

        res.send('Login successful!');

      } else {

        console.error("LOGIN_FAILED: Wrong password", emailOrUsername);

        res.send('Wrong password');
      }
    }
  );
});

app.listen(5000, () => console.log('Backend running on port 5000'));
