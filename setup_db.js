require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        console.error('Please make sure your MySQL server is running and your .env file has the correct password.');
        process.exit(1);
    }
    console.log('Connected to MySQL server.');

    const dbName = process.env.DB_NAME || 'ecommerce_db';

    connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
        if (err) {
            console.error('Error creating database:', err);
            process.exit(1);
        }
        console.log(`Database '${dbName}' created or already exists.`);

        connection.changeUser({ database: dbName }, (err) => {
            if (err) {
                console.error('Error switching to database:', err);
                process.exit(1);
            }

            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password_hash VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `;

            connection.query(createTableQuery, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                } else {
                    console.log('Users table created or already exists.');
                }
                connection.end();
            });
        });
    });
});
