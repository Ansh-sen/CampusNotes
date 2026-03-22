const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'campus_notes'
  });
  console.log('Connected to MySQL');

  try {
    // Create purchases table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36),
        listing_id VARCHAR(36),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (user_id),
        INDEX (listing_id)
      )
    `);
    console.log('Created purchases table');
  } catch (e) {
    console.log('Error creating purchases table:', e.message);
  }

  await conn.end();
}

run().catch(console.error);
