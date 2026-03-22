const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkCols() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_notes'
    });
    
    try {
        const [convCols] = await db.execute('DESCRIBE conversations');
        console.table(convCols);
        const hasListingId = convCols.some(c => c.Field === 'listing_id');
        if (!hasListingId) {
            console.log('Missing listing_id in conversations. Adding it...');
            await db.execute('ALTER TABLE conversations ADD COLUMN listing_id INT');
            console.log('Added listing_id to conversations.');
        } else {
            console.log('conversations.listing_id exists.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.end();
    }
}

checkCols();
