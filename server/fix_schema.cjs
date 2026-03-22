const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSchema() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_notes'
    });
    
    try {
        console.log('--- Fixing Database Schema ---');

        // 1. Bookmarks Table
        console.log('Creating bookmarks table if missing...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS bookmarks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                listing_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_bookmark (user_id, listing_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
            )
        `);

        // 2. Reviews Table
        console.log('Creating reviews table if missing...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                listing_id INT NOT NULL,
                reviewer_id INT NOT NULL,
                seller_id INT NOT NULL,
                rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
                FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 3. Profiles Table (Ensure columns exist)
        console.log('Checking profiles columns...');
        const [profCols] = await db.execute('DESCRIBE profiles');
        const hasTopper = profCols.some(c => c.Field === 'is_topper');
        if (!hasTopper) {
            await db.execute('ALTER TABLE profiles ADD COLUMN is_topper BOOLEAN DEFAULT FALSE');
            console.log('Added is_topper to profiles.');
        }

        const hasRating = profCols.some(c => c.Field === 'rating_avg');
        if (!hasRating) {
            await db.execute('ALTER TABLE profiles ADD COLUMN rating_avg DECIMAL(3,2) DEFAULT 0.00');
            console.log('Added rating_avg to profiles.');
        }

        const hasSales = profCols.some(c => c.Field === 'total_sales');
        if (!hasSales) {
            await db.execute('ALTER TABLE profiles ADD COLUMN total_sales INT DEFAULT 0');
            console.log('Added total_sales to profiles.');
        }

        console.log('Schema repair completed!');
    } catch (err) {
        console.error('Error during schema repair:', err);
    } finally {
        await db.end();
    }
}

fixSchema();
