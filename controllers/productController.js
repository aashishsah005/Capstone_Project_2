const fs = require('fs');
const path = require('path');
const { runScraper } = require('../utils/scraperUtils');

exports.getProducts = (req, res) => {
    const productsPath = path.join(__dirname, '..', 'data', 'products.json');
    fs.readFile(productsPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading products file:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        res.json(JSON.parse(data));
    });
};

exports.scrapeProducts = (req, res) => {
    const query = req.query.query;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter required' });
    }

    let completed = 0;
    const results = [];
    let hasSentResponse = false;

    const handleScrapingResult = (err, data) => {
        if (err) {
            console.error(err.message);
        } else {
            results.push(...data.slice(0, 5));
        }

        completed++;
        if (completed === 2 && !hasSentResponse) {
            hasSentResponse = true;
            res.json(results);
        }
    };

    runScraper('amazon_scraper.py', query, handleScrapingResult);
    runScraper('flipkart_scraper.py', query, handleScrapingResult);
};
