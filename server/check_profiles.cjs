const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkProfiles() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_notes'
    });
    
    try {
        const [columns] = await db.execute('DESCRIBE profiles');
        console.log('--- PROFILES SCHEMA ---');
        console.table(columns);
        
        const hasTopper = columns.some(c => c.Field === 'is_topper');
        if (!hasTopper) {
            console.log('Missing is_topper column. Adding it now...');
            await db.execute('ALTER TABLE profiles ADD COLUMN is_topper BOOLEAN DEFAULT FALSE');
            console.log('is_topper column added.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await db.end();
    }
}

checkProfiles();
