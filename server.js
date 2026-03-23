const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database Connection (SQLite)
require('dotenv').config();
const mysql = require('mysql2');

// ... (other imports)

// Database Connection (MySQL)
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'ecommerce_db';

function connectToDatabase() {
    const db = mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        multipleStatements: true
    });

    db.connect((err) => {
        if (err) {
            console.error('Failed to connect to MySQL database', DB_NAME, '->', err.message);
            return;
        }
        console.log('Connected to MySQL database:', DB_NAME);
        initializeDatabase(db);
    });

    return db;
}

function ensureDatabaseExists(callback) {
    const adminDb = mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        multipleStatements: true
    });

    adminDb.connect((err) => {
        if (err) {
            console.error('Error connecting to MySQL server:', err.message);
            process.exit(1);
            return;
        }

        adminDb.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`, (err) => {
            if (err) {
                console.error('Error creating database:', err.message);
                adminDb.end();
                process.exit(1);
                return;
            }

            console.log('Database checked/created:', DB_NAME);
            adminDb.end();
            callback();
        });
    });
}

let db;
ensureDatabaseExists(() => {
    db = connectToDatabase();
});

function initializeDatabase(connection) {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    connection.query(createTableQuery, (err) => {
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

// Scrape products
app.get('/api/scrape', (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter required' });
    }

    const { spawn } = require('child_process');

    function parseChildOutput(raw) {
        const trimmed = raw.trim();
        if (!trimmed) return [];

        const first = trimmed.indexOf('[');
        const last = trimmed.lastIndexOf(']');
        if (first !== -1 && last !== -1 && last >= first) {
            const jsonText = trimmed.slice(first, last + 1);
            try {
                return JSON.parse(jsonText);
            } catch (e) {
                console.error('Invalid JSON chunk from scraper:', e.message);
            }
        }

        try {
            return JSON.parse(trimmed);
        } catch (e) {
            console.error('JSON.parse failed for scraper output:', e.message);
        }
        return [];
    }

    // Run Amazon scraper
    const amazonProcess = spawn('python', ['amazon_scraper.py', query], { cwd: __dirname });
    let amazonData = '';
    amazonProcess.stdout.on('data', (data) => {
        amazonData += data.toString();
    });
    amazonProcess.stderr.on('data', (data) => {
        console.error('Amazon scraper stderr:', data.toString());
    });

    // Run Flipkart scraper
    const flipkartProcess = spawn('python', ['flipkart_scraper.py', query], { cwd: __dirname });
    let flipkartData = '';
    flipkartProcess.stdout.on('data', (data) => {
        flipkartData += data.toString();
    });
    flipkartProcess.stderr.on('data', (data) => {
        console.error('Flipkart scraper stderr:', data.toString());
    });

    let completed = 0;
    const results = [];

    amazonProcess.on('close', (code) => {
        if (code === 0) {
            const amazonResults = parseChildOutput(amazonData);
            results.push(...amazonResults.slice(0, 5)); // Take first 5
        } else {
            console.error(`Amazon process exited with code ${code}`);
        }
        completed++;
        if (completed === 2) {
            return res.json(results);
        }
    });

    flipkartProcess.on('close', (code) => {
        if (code === 0) {
            const flipkartResults = parseChildOutput(flipkartData);
            results.push(...flipkartResults.slice(0, 5)); // Take first 5
        } else {
            console.error(`Flipkart process exited with code ${code}`);
        }
        completed++;
        if (completed === 2) {
            return res.json(results);
        }
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
