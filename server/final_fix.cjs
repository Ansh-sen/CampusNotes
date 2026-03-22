const mysql = require('mysql2/promise');
require('dotenv').config();

async function finalFix() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_notes'
    });
    
    try {
        // Enforce all required columns for MyListings logic
        const additions = [
            { table: 'listings', sql: 'ALTER TABLE listings ADD COLUMN is_draft BOOLEAN DEFAULT FALSE' },
            { table: 'listings', sql: 'ALTER TABLE listings ADD COLUMN view_count INT DEFAULT 0' },
            { table: 'listings', sql: "ALTER TABLE listings ADD COLUMN status ENUM('available', 'paused', 'sold') DEFAULT 'available'" },
            { table: 'conversations', sql: 'ALTER TABLE conversations ADD COLUMN listing_id INT' },
            { table: 'profiles', sql: 'ALTER TABLE profiles ADD COLUMN is_topper BOOLEAN DEFAULT FALSE' },
            { table: 'profiles', sql: 'ALTER TABLE profiles ADD COLUMN rating_avg DECIMAL(3,2) DEFAULT 0.00' },
            { table: 'profiles', sql: 'ALTER TABLE profiles ADD COLUMN total_sales INT DEFAULT 0' }
        ];

        for (const add of additions) {
            try {
                await db.execute(add.sql);
                console.log(`Executed: ${add.sql}`);
            } catch (e) {
                if (e.message.includes('Duplicate column name')) {
                    console.log(`Column already exists for ${add.table}`);
                } else {
                    console.error(`Error on ${add.table}: ${e.message}`);
                }
            }
        }

        console.log('Final schema fix completed.');
    } catch (err) {
        console.error('Final Fix Error:', err);
    } finally {
        await db.end();
    }
}

finalFix();
