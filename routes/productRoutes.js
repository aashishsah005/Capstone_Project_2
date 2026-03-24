const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/products', productController.getProducts);
router.get('/scrape', productController.scrapeProducts);

module.exports = router;
