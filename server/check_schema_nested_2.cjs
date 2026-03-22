const mysql = require('mysql2');
require('dotenv').config();

async function checkSchema() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_notes',
    });
    const promisePool = pool.promise();
    const [listings] = await promisePool.execute('DESCRIBE listings');
    console.log('LISTINGS SCHEMA (16-35):');
    listings.slice(15, 35).forEach(col => console.log(`${col.Field}: ${col.Type} | Null: ${col.Null} | Key: ${col.Key} | Default: ${col.Default}`));
    await pool.end();
}

checkSchema().catch(console.error);
