/**
 * ⚠️  ONE-TIME MIGRATION UTILITY ⚠️
 * 
 * This script was used to migrate plain-text passwords to Argon2 hashes.
 * It has already been run. DO NOT run again — it will have no effect on already-
 * hashed passwords (it skips $argon2 entries), but running unnecessarily is wasteful.
 * 
 * Kept for reference and audit purposes only.
 */
const mysql = require('mysql2/promise');
const argon2 = require('argon2');
require('dotenv').config();

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'mysql',
        database: process.env.DB_NAME || 'ecommerce_db',
        port: Number(process.env.DB_PORT) || 3306
    });

    console.log('Connected to DB for migration.');

    try {
        const [users] = await connection.execute('SELECT id, email, password_hash FROM users');
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            if (user.password_hash && user.password_hash.startsWith('$argon2')) {
                console.log(`User ID ${user.id} (${user.email}) already hashed. Skipping.`);
                continue;
            }

            console.log(`Hashing password for User ID ${user.id} (${user.email})...`);
            try {
                const hashedPassword = await argon2.hash(user.password_hash);
                const [result] = await connection.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, user.id]);

                if (result.affectedRows > 0) {
                    console.log(`User ID ${user.id} updated successfully.`);
                } else {
                    console.error(`User ID ${user.id} update FAILED (0 rows affected).`);
                }
            } catch (hashErr) {
                console.error(`Error processing ID ${user.id}:`, hashErr.message);
            }
        }
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        await connection.end();
        console.log('Migration process finished.');
    }
}

migrate();
