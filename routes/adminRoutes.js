const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

router.post('/admin/add-product', adminAuth, adminController.addProduct);
router.get('/admin/users', adminAuth, adminController.getUsers);
router.delete('/admin/users/:id', adminAuth, adminController.deleteUser);
router.get('/admin/stats', adminAuth, adminController.getStats);
router.get('/admin/sales-history', adminAuth, adminController.getSalesHistory);
router.post('/admin/change-password', adminAuth, adminController.changePassword);

module.exports = router;
