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
    console.log('Adding read_at to messages...');
    await conn.execute('ALTER TABLE messages ADD COLUMN read_at DATETIME NULL AFTER delivered_at');
    console.log('Added read_at successfully');
  } catch (e) {
    console.log(e.message);
  }

  await conn.end();
}

run().catch(console.error);
