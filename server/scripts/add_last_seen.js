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
    // Add last_seen_at column to profiles
    await conn.execute(`
      ALTER TABLE profiles 
      ADD COLUMN last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Added last_seen_at to profiles table');
  } catch (e) {
    if (e.message.includes('Duplicate column name')) {
        console.log('last_seen_at already exists in profiles table');
    } else {
        console.log('Error updating profiles table:', e.message);
    }
  }

  try {
    // Ensure conversations table has last_message_at
    await conn.execute(`
        ALTER TABLE conversations 
        ADD COLUMN last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Added last_message_at to conversations table');
  } catch (e) {
    if (e.message.includes('Duplicate column name')) {
        console.log('last_message_at already exists in conversations table');
    } else {
        console.log('Error updating conversations table:', e.message);
    }
  }

  await conn.end();
}

run().catch(console.error);
