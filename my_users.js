require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.message);
        process.exit(1);
    }
});

console.log('Fetching users from database...\n');
console.log('ID | Username | Email | Created At');
console.log('---|----------|-------|-----------');

db.query("SELECT * FROM users", (err, results) => {
    if (err) {
        console.error(err.message);
    } else {
        results.forEach((row) => {
            console.log(`${row.id} | ${row.username} | ${row.email} | ${row.created_at}`);
        });
        console.log(`\nTotal Users: ${results.length}`);
    }
    db.end();
});
