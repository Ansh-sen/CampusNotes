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
    // 1. Update messages table for read receipts and meetup proposals
    console.log('Updating messages table...');
    await conn.execute(`
      ALTER TABLE messages 
      ADD COLUMN message_type ENUM('text', 'meetup_proposal') DEFAULT 'text',
      ADD COLUMN delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN read_at DATETIME NULL
    `);
    console.log('Updated messages table successfully');
  } catch (e) {
    if (e.message.includes('Duplicate column name')) {
        console.log('Column already exists in messages table, skipping...');
    } else {
        console.error('Error updating messages table:', e.message);
    }
  }

  try {
    // 2. Create blocked_users table
    console.log('Creating blocked_users table...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS blocked_users (
        blocker_id CHAR(36),
        blocked_id CHAR(36),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (blocker_id, blocked_id)
      )
    `);
    console.log('Created blocked_users table successfully');
  } catch (e) {
    console.error('Error creating blocked_users table:', e.message);
  }

  try {
    // 3. Create scheduled_meetups table
    console.log('Creating scheduled_meetups table...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS scheduled_meetups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        listing_id CHAR(36),
        buyer_id CHAR(36),
        seller_id CHAR(36),
        meetup_date DATE,
        meetup_time TIME,
        location VARCHAR(255),
        amount DECIMAL(10,2),
        status ENUM('scheduled', 'completed', 'cancelled', 'reported') DEFAULT 'scheduled',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created scheduled_meetups table successfully');
  } catch (e) {
    console.error('Error creating scheduled_meetups table:', e.message);
  }

  try {
    // 4. Add last_seen_at to profiles
    console.log('Adding last_seen_at to profiles...');
    await conn.execute(`
      ALTER TABLE profiles ADD COLUMN last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);
    console.log('Added last_seen_at successfully');
  } catch (e) {
    if (e.message.includes('Duplicate column name')) {
        console.log('last_seen_at already exists, skipping...');
    } else {
        console.error('Error adding last_seen_at:', e.message);
    }
  }

  await conn.end();
}

run().catch(console.error);
