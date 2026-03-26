const { getDb } = require('../config/db');
const argon2 = require('argon2');

exports.signup = async (req, res) => {
    const { username, email, password } = req.body;
    const db = getDb();

    if (!db) {
        return res.status(500).json({ error: 'Database connection not established' });
    }

    try {
        // Hash the password using Argon2
        const password_hash = await argon2.hash(password);
        
        const isAdmin = (email === 'admin@quickdeals.com') ? 1 : 0;
        const query = 'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)';
        
        db.query(query, [username, email, password_hash, isAdmin], function (err, results) {
            if (err) {
                console.error('Signup error:', err.message);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Email or Username already taken' });
                }
                return res.status(500).json({ error: 'Server error during registration' });
            }
            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (err) {
        console.error('Hashing error:', err);
        res.status(500).json({ error: 'Error processing password' });
    }
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    const db = getDb();

    if (!db) {
        return res.status(500).json({ error: 'Database connection not established' });
    }

    const userQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(userQuery, [email], async (err, results) => {
        if (err) {
            console.error('Login error:', err.message);
            return res.status(500).json({ error: 'Login failed' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const row = results[0];

        try {
            // Verify the password using Argon2
            if (await argon2.verify(row.password_hash, password)) {
                res.json({ 
                    message: 'Login successful', 
                    user: { 
                        id: row.id, 
                        username: row.username,
                        is_admin: row.is_admin === 1
                    } 
                });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            // Fallback for plain text passwords during transition if needed, 
            // but the plan is to migrate them all.
            if (row.password_hash === password) {
                res.json({ 
                    message: 'Login successful (Plain-text fallback)', 
                    user: { 
                        id: row.id, 
                        username: row.username,
                        is_admin: row.is_admin === 1
                    } 
                });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        }
    });
};
