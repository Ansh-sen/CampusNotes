const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_notes'
    });
    
    try {
        console.log('Checking for "hi" in messages table...');
        const [hiRows] = await db.execute("SELECT * FROM messages WHERE content LIKE '%hi%' OR id = '0' OR id = 0");
        console.log('Found rows:', hiRows.length);
        console.table(hiRows);

        console.log('\nChecking table structure for messages...');
        const [cols] = await db.execute('DESCRIBE messages');
        console.table(cols);

        console.log('\nChecking some recent messages...');
        const [recent] = await db.execute('SELECT * FROM messages ORDER BY created_at DESC LIMIT 5');
        console.table(recent);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.end();
    }
}

check();
