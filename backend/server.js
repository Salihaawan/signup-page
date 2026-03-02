// backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Signup route
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required!' });
    }

    const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    db.query(query, [username, email, password], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Database error!' });
        }
        res.status(200).json({ message: 'Signup successful!' });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});