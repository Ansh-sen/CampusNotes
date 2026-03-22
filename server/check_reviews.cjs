const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkReviews() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_notes'
    });
    
    try {
        const [columns] = await db.execute('DESCRIBE reviews');
        console.table(columns);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.end();
    }
}

checkReviews();
