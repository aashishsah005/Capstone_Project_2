const fs = require('fs');
const path = require('path');
const { getDb } = require('../config/db');

const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

const addProduct = async (req, res) => {
    try {
        const newProduct = req.body;

        if (!newProduct.product_id || !newProduct.product_name) {
            return res.status(400).json({ message: 'Product ID and Name are required' });
        }

        const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
        const json = JSON.parse(data);

        if (json.products.find(p => p.product_id === newProduct.product_id)) {
            return res.status(400).json({ message: 'Product ID already exists' });
        }

        json.products.push(newProduct);
        fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(json, null, 2), 'utf8');

        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getUsers = (req, res) => {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database connecting, please try again' });
    
    db.query('SELECT id, username, email, password_hash as password, created_at FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

const deleteUser = (req, res) => {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database connecting, please try again' });
    
    const { id } = req.params;
    db.query('DELETE FROM users WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted successfully' });
    });
};

const getStats = (req, res) => {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database connecting, please try again' });

    const query = `
        SELECT 
            COUNT(*) as total_orders, 
            COALESCE(SUM(total_amount), 0) as total_revenue,
            (SELECT COUNT(*) FROM users) as total_users
        FROM orders
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results[0]);
    });
};

const changePassword = (req, res) => {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database connecting, please try again' });
    
    const { userId, newPassword } = req.body;
    db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPassword, userId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Password updated successfully' });
    });
};

const getSalesHistory = (req, res) => {
    const db = getDb();
    if (!db) return res.status(503).json({ error: 'Database connecting, please try again' });

    const query = `
        SELECT DATE(created_at) as date, SUM(total_amount) as total 
        FROM orders 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) 
        GROUP BY DATE(created_at) 
        ORDER BY date ASC
    `;
    db.query(query, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

module.exports = {
    addProduct,
    getUsers,
    deleteUser,
    getStats,
    getSalesHistory,
    changePassword
};
