const { metrics, logger } = require('./tracing');
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('combined'));

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('DB connection failed:', err);
  } else {
    console.log('DB connected successfully');
    connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      connection.release();
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        console.log('Users table is ready ✅');
      }
    });
  }
});

// ── SIGNUP ────────────────────────────────────────────────
app.post('/signup', (req, res) => {
  console.log('Incoming request:', req.method, req.url, req.body);

  // INCREMENT METRIC: signup attempt
  metrics.signupCounter.add(1);

  // SEND LOG to collector
  logger.emit({
    severityText: 'INFO',
    body: `Signup attempt for username: ${req.body.username}`,
    attributes: { username: req.body.username, email: req.body.email },
  });

  const { username, email, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [email, username],
    (err, result) => {
      if (err) {
        console.error("SIGNUP_ERROR: Database error", err);
        logger.emit({ severityText: 'ERROR', body: `Signup DB error: ${err.message}` });
        return res.status(500).send('Database error');
      }

      if (result.length > 0) {
        console.error("SIGNUP_FAILED: User already exists", email);
        logger.emit({ severityText: 'WARN', body: `Signup failed - user exists: ${email}` });
        return res.send('User already exists');
      }

      db.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, password],
        (err2) => {
          if (err2) {
            console.error("SIGNUP_ERROR: Insert failed", err2);
            logger.emit({ severityText: 'ERROR', body: `Signup insert failed: ${err2.message}` });
            return res.status(500).send('Database error');
          }

          console.log("SIGNUP_SUCCESS:", username);
          logger.emit({
            severityText: 'INFO',
            body: `Signup success for: ${username}`,
            attributes: { username, email },
          });

          res.send(`Account created! Your credentials:\nUsername: ${username}\nEmail: ${email}`);
        }
      );
    }
  );
});

// ── LOGIN ─────────────────────────────────────────────────
app.post('/login', (req, res) => {
  console.log('Incoming request:', req.method, req.url, req.body);

  // INCREMENT METRIC: login attempt
  metrics.loginCounter.add(1);

  // SEND LOG to collector
  logger.emit({
    severityText: 'INFO',
    body: `Login attempt for: ${req.body.emailOrUsername}`,
    attributes: { emailOrUsername: req.body.emailOrUsername },
  });

  const { emailOrUsername, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email = ? OR username = ?',
    [emailOrUsername, emailOrUsername],
    (err, result) => {
      if (err) {
        console.error("LOGIN_ERROR: Database error", err);
        logger.emit({ severityText: 'ERROR', body: `Login DB error: ${err.message}` });
        return res.status(500).send('Database error');
      }

      if (result.length === 0) {
        console.error("LOGIN_FAILED: User does not exist", emailOrUsername);
        metrics.loginFailCounter.add(1);
        logger.emit({ severityText: 'WARN', body: `Login failed - user not found: ${emailOrUsername}` });
        return res.send('User does not exist');
      }

      if (result[0].password === password) {
        console.log("LOGIN_SUCCESS:", emailOrUsername);
        metrics.loginSuccessCounter.add(1);
        logger.emit({
          severityText: 'INFO',
          body: `Login success for: ${emailOrUsername}`,
          attributes: { emailOrUsername },
        });
        res.send('Login successful!');
      } else {
        console.error("LOGIN_FAILED: Wrong password", emailOrUsername);
        metrics.loginFailCounter.add(1);
        logger.emit({ severityText: 'WARN', body: `Login failed - wrong password: ${emailOrUsername}` });
        res.send('Wrong password');
      }
    }
  );
});

app.listen(5000, () => console.log('Backend running on port 5000'));
