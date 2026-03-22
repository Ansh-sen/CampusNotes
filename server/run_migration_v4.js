const db = require('./db');
const fs = require('fs');

async function migrate() {
  try {
    await db.query('ALTER TABLE listings ADD COLUMN file_url VARCHAR(255) DEFAULT NULL');
    console.log('Migration successful: Added file_url to listings');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Migration already applied');
    } else {
      console.error('Migration failed:', err);
    }
  } finally {
    process.exit();
  }
}

migrate();
