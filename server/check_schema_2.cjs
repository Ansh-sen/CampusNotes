const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_notes'
    });
    
    try {
        const tables = ['listings', 'conversations', 'reviews'];
        for (const table of tables) {
            try {
                const [columns] = await db.execute(`DESCRIBE ${table}`);
                console.log(`--- ${table.toUpperCase()} SCHEMA ---`);
                console.table(columns);
            } catch (e) {
                console.log(`Table ${table} error: ${e.message}`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.end();
    }
}

checkSchema();
