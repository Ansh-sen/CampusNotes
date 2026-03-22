const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixReviews() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_notes'
    });
    
    try {
        console.log('--- Ensuring Reviews Schema ---');
        const [columns] = await db.execute('DESCRIBE reviews');
        
        const required = [
            { name: 'listing_id', sql: 'ALTER TABLE reviews ADD COLUMN listing_id INT NOT NULL' },
            { name: 'reviewer_id', sql: 'ALTER TABLE reviews ADD COLUMN reviewer_id INT NOT NULL' },
            { name: 'seller_id', sql: 'ALTER TABLE reviews ADD COLUMN seller_id INT NOT NULL' },
            { name: 'rating', sql: 'ALTER TABLE reviews ADD COLUMN rating INT NOT NULL' },
            { name: 'comment', sql: 'ALTER TABLE reviews ADD COLUMN comment TEXT' }
        ];

        for (const req of required) {
            if (!columns.some(c => c.Field === req.name)) {
                await db.execute(req.sql);
                console.log(`Added column ${req.name} to reviews.`);
            } else {
                console.log(`Column ${req.name} already exists in reviews.`);
            }
        }

        console.log('Reviews schema fix completed.');
    } catch (err) {
        if (err.message.includes("Table 'campus_notes.reviews' doesn't exist")) {
             console.log('Table reviews missing. Creating it now...');
             await db.execute(`
                CREATE TABLE reviews (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    listing_id INT NOT NULL,
                    reviewer_id INT NOT NULL,
                    seller_id INT NOT NULL,
                    rating INT NOT NULL,
                    comment TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
             `);
             console.log('Table reviews created.');
        } else {
            console.error('Error fixing reviews:', err);
        }
    } finally {
        await db.end();
    }
}

fixReviews();
