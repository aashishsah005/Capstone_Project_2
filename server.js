const express = require('express');
const mysql = require('mysql2');
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

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Default XAMPP/MySQL user
    password: '', // Default XAMPP/MySQL password (empty)
    database: 'ecommerce_analyzer'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        console.log('Ensure you have created the database "ecommerce_analyzer" using the schema.sql file.');
    } else {
        console.log('Connected to MySQL database');
    }
});

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
    db.query(query, [username, email, password], (err, result) => {
        if (err) {
            console.error('Signup error:', err);
            return res.status(500).json({ error: 'Signup failed. Email might be taken.' });
        }
        res.status(201).json({ message: 'User registered successfully' });
    });
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    // Check if user exists first
    const userQuery = 'SELECT * FROM users WHERE email = ?';
    db.execute(userQuery, [email], (err, results) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ error: 'Login failed' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = results[0];
        // In a real app, use bcrypt.compare(password, user.password_hash)
        if (user.password_hash === password) {
            res.json({ message: 'Login successful', user: { id: user.id, username: user.username } });
        } else {
            res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
