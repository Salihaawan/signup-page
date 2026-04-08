// backend/db.js
const mysql = require('mysql2');
require('dotenv').config();

// Step 1: Connect WITHOUT database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 3306
});

connection.connect((err) => {
  if (err) {
    console.log('Database connection error:', err);
    return;
  }
  console.log('Connected to RDS MySQL instance!');

  // Step 2: Create database if not exists
  connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`, (err) => {
    if (err) {
      console.error('Error creating database:', err);
      return;
    }
    console.log(`Database '${process.env.DB_NAME}' is ready ✅`);

    // Step 3: Use the database
    connection.changeUser({ database: process.env.DB_NAME }, (err) => {
      if (err) throw err;

      // Step 4: Create users table if not exists
      const createUsersTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(100) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      connection.query(createUsersTableQuery, (err, result) => {
        if (err) {
          console.error('Error creating users table:', err);
        } else {
          console.log('Users table is ready ✅');
        }
      });
    });
  });
});

module.exports = connection;
