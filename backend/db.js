// backend/db.js
const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'signupdb',
});

connection.connect((err) => {
    if (err) {
        console.log('Database connection error:', err);
    } else {
        console.log('Connected to MySQL database!');
    }
});

module.exports = connection;