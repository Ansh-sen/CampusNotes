const db = require('./db');

async function migrate() {
    try {
        console.log('Running database migrations...');

        // Messages table
        try {
            await db.query(`ALTER TABLE messages ADD COLUMN file_url VARCHAR(255) DEFAULT NULL;`);
            console.log('Added file_url to messages.');
        } catch (e) {
            console.log('file_url may already exist or error:', e.message);
        }

        try {
            await db.query(`ALTER TABLE messages ADD COLUMN file_name VARCHAR(255) DEFAULT NULL;`);
            console.log('Added file_name to messages.');
        } catch (e) {
            console.log('file_name may already exist or error:', e.message);
        }

        try {
            await db.query(`ALTER TABLE messages ADD COLUMN file_type VARCHAR(50) DEFAULT NULL;`);
            console.log('Added file_type to messages.');
        } catch (e) {
            console.log('file_type may already exist or error:', e.message);
        }

        try {
            await db.query(`ALTER TABLE messages ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;`);
            console.log('Added is_edited to messages.');
        } catch (e) {
            console.log('is_edited may already exist or error:', e.message);
        }

        try {
            await db.query(`ALTER TABLE listings ADD COLUMN subject VARCHAR(100) DEFAULT NULL;`);
            console.log('Added subject to listings.');
        } catch (e) {
            console.log('subject may already exist or error:', e.message);
        }

        try {
            await db.query(`ALTER TABLE listings ADD COLUMN branch VARCHAR(100) DEFAULT NULL;`);
            console.log('Added branch to listings.');
        } catch (e) {
            console.log('branch may already exist or error:', e.message);
        }

        try {
            await db.query(`ALTER TABLE listings ADD COLUMN year VARCHAR(50) DEFAULT NULL;`);
            console.log('Added year to listings.');
        } catch (e) {
            console.log('year may already exist or error:', e.message);
        }

        try {
            await db.query(`ALTER TABLE listings ADD COLUMN semester VARCHAR(50) DEFAULT NULL;`);
            console.log('Added semester to listings.');
        } catch (e) {
            console.log('semester may already exist or error:', e.message);
        }

        try {
            await db.query(`ALTER TABLE listings ADD COLUMN material_type VARCHAR(100) DEFAULT NULL;`);
            console.log('Added material_type to listings.');
        } catch (e) {
            console.log('material_type may already exist or error:', e.message);
        }

        try {
            await db.query(`ALTER TABLE listings ADD COLUMN item_condition VARCHAR(50) DEFAULT NULL;`);
            console.log('Added item_condition to listings.');
        } catch (e) {
            console.log('item_condition may already exist or error:', e.message);
        }

        try {
            await db.query(`ALTER TABLE listings ADD COLUMN is_draft BOOLEAN DEFAULT FALSE;`);
            console.log('Added is_draft to listings.');
        } catch (e) {
            console.log('is_draft may already exist or error:', e.message);
        }

        // Create listing_images table
        await db.query(`
            CREATE TABLE IF NOT EXISTS listing_images (
                id INT AUTO_INCREMENT PRIMARY KEY,
                listing_id VARCHAR(36) NOT NULL,
                image_url VARCHAR(255) NOT NULL,
                is_cover BOOLEAN DEFAULT FALSE,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
            )
        `);
        console.log('Ensured listing_images table exists.');

        // Create listing_tags table
        await db.query(`
            CREATE TABLE IF NOT EXISTS listing_tags (
                id INT AUTO_INCREMENT PRIMARY KEY,
                listing_id VARCHAR(36) NOT NULL,
                tag_name VARCHAR(50) NOT NULL,
                FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
            )
        `);
        console.log('Ensured listing_tags table exists.');

        console.log('Migrations complete.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
