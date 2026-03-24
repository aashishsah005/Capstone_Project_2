const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.status(200).json(order);
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
};

exports.verifyPayment = (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, amount, userId } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpay_signature) {
            const { getDb } = require('../config/db');
            const db = getDb();
            const orderQuery = 'INSERT INTO orders (user_id, items, total_amount, payment_id) VALUES (?, ?, ?, ?)';
            db.query(orderQuery, [userId, JSON.stringify(items), amount, razorpay_payment_id], (err) => {
                if (err) {
                    console.error('Error saving order:', err);
                    return res.status(500).json({ success: true, message: 'Payment verified but order saving failed', warning: true });
                }
                res.status(200).json({ success: true, message: 'Payment verified and order saved' });
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
};
