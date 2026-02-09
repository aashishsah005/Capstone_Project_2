const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection (SQLite)
require('dotenv').config();
const mysql = require('mysql2');

// ... (other imports)

// Database Connection (MySQL)
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.message);
        return;
    }
    console.log('Connected to the MySQL database.');
    initializeDatabase();
});

function initializeDatabase() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    db.query(createTableQuery, (err) => {
        if (err) {
            console.error('Error creating/verifying users table:', err.message);
        } else {
            console.log('Users table ready.');
        }
    });
}

// Routes

// Get all products
app.get('/api/products', (req, res) => {
    const productsPath = path.join(__dirname, 'data', 'products.json');
    fs.readFile(productsPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading products file:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        res.json(JSON.parse(data));
    });
});

// Signup
app.post('/api/signup', (req, res) => {
    const { username, email, password } = req.body;

    // In a real app, hash the password!
    const query = 'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)';
    db.query(query, [username, email, password], function (err, results) {
        if (err) {
            console.error('Signup error:', err.message);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Email or Username already taken' });
            }
            return res.status(500).json({ error: 'Server error during registration' });
        }
        res.status(201).json({ message: 'User registered successfully' });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    const userQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(userQuery, [email], (err, results) => {
        if (err) {
            console.error('Login error:', err.message);
            return res.status(500).json({ error: 'Login failed' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const row = results[0];

        // In a real app, use bcrypt.compare(password, user.password_hash)
        if (row.password_hash === password) {
            res.json({ message: 'Login successful', user: { id: row.id, username: row.username } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
