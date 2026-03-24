const { getDb } = require('../config/db');

exports.signup = (req, res) => {
    const { username, email, password } = req.body;
    const db = getDb();

    if (!db) {
        return res.status(500).json({ error: 'Database connection not established' });
    }

    // In a real app, hash the password!
    const isAdmin = (email === 'admin@quickdeals.com') ? 1 : 0;
    const query = 'INSERT INTO users (username, email, password_hash, is_admin) VALUES (?, ?, ?, ?)';
    db.query(query, [username, email, password, isAdmin], function (err, results) {
        if (err) {
            console.error('Signup error:', err.message);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Email or Username already taken' });
            }
            return res.status(500).json({ error: 'Server error during registration' });
        }
        res.status(201).json({ message: 'User registered successfully' });
    });
};

exports.login = (req, res) => {
    const { email, password } = req.body;
    const db = getDb();

    if (!db) {
        return res.status(500).json({ error: 'Database connection not established' });
    }

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
    });
};
