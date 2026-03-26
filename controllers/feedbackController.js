const { getDb } = require('../config/db');

exports.addFeedback = (req, res) => {
    const { product_id, username, feedback } = req.body;

    if (!product_id || !username || !feedback) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const db = getDb();
    const query = 'INSERT INTO product_feedback (product_id, username, feedback) VALUES (?, ?, ?)';

    db.query(query, [product_id, username, feedback], (err, result) => {
        if (err) {
            console.error('Error saving feedback:', err);
            return res.status(500).json({ error: 'Failed to save feedback' });
        }
        res.status(201).json({ message: 'Feedback submitted successfully', feedbackId: result.insertId });
    });
};

exports.getFeedback = (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    const db = getDb();
    const query = 'SELECT * FROM product_feedback WHERE product_id = ? ORDER BY created_at DESC';

    db.query(query, [productId], (err, results) => {
        if (err) {
            console.error('Error fetching feedback:', err);
            return res.status(500).json({ error: 'Failed to fetch feedback' });
        }
        res.json(results);
    });
};
