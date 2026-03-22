const mysql = require('mysql2/promise');
require('dotenv').config();

async function auditSchema() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'campus_notes'
    });
    
    try {
        console.log('--- Comprehensive Schema Audit ---');
        
        const checks = [
            { table: 'listings', column: 'is_draft' },
            { table: 'listings', column: 'view_count' },
            { table: 'listings', column: 'status' },
            { table: 'conversations', column: 'listing_id' },
            { table: 'profiles', column: 'is_topper' },
            { table: 'profiles', column: 'rating_avg' },
            { table: 'bookmarks', column: 'listing_id' }
        ];

        for (const check of checks) {
            try {
                const [columns] = await db.execute(`DESCRIBE ${check.table}`);
                const hasCol = columns.some(c => c.Field === check.column);
                if (hasCol) {
                    console.log(`[OK] ${check.table}.${check.column} exists.`);
                } else {
                    console.log(`[MISSING] ${check.table}.${check.column} is missing!`);
                    // Attempt to add it if it's a simple column
                    if (check.column === 'view_count') {
                        await db.execute('ALTER TABLE listings ADD COLUMN view_count INT DEFAULT 0');
                        console.log(`Added listings.view_count.`);
                    }
                    if (check.column === 'listing_id' && check.table === 'conversations') {
                        await db.execute('ALTER TABLE conversations ADD COLUMN listing_id INT');
                        console.log(`Added conversations.listing_id.`);
                    }
                }
            } catch (e) {
                console.log(`[ERROR] Table ${check.table} check failed: ${e.message}`);
            }
        }
    } catch (err) {
        console.error('Audit Error:', err);
    } finally {
        await db.end();
    }
}

auditSchema();
