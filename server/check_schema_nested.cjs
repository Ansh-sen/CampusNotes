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
    
    console.log('LISTING_IMAGES SCHEMA:');
    const [images] = await promisePool.execute('DESCRIBE listing_images');
    images.forEach(col => console.log(`${col.Field}: ${col.Type} | Null: ${col.Null} | Key: ${col.Key} | Default: ${col.Default} | Extra: ${col.Extra}`));
    
    console.log('\nLISTING_TAGS SCHEMA:');
    const [tags] = await promisePool.execute('DESCRIBE listing_tags');
    tags.forEach(col => console.log(`${col.Field}: ${col.Type} | Null: ${col.Null} | Key: ${col.Key} | Default: ${col.Default} | Extra: ${col.Extra}`));
    
    await pool.end();
}

checkSchema().catch(console.error);
