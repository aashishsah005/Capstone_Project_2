const mysql = require('mysql2');
require('dotenv').config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'ecommerce_db';

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

function initializeDatabase(connection) {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            is_admin TINYINT(1) DEFAULT 0,
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

    const createOrdersTableQuery = `
        CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            items JSON NOT NULL,
            total_amount DECIMAL(10, 2) NOT NULL,
            status VARCHAR(50) DEFAULT 'completed',
            payment_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )
    `;

    connection.query(createOrdersTableQuery, (err) => {
        if (err) {
            console.error('Error creating/verifying orders table:', err.message);
        } else {
            console.log('Orders table ready.');
        }
    });
}

let db;

function connectToDatabase() {
    db = mysql.createConnection({
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

ensureDatabaseExists(() => {
    connectToDatabase();
});

module.exports = {
    getDb: () => db
};
