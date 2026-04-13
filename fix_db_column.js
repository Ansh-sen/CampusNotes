const db = require('./server/db');

async function fixColumn() {
    try {
        console.log("Starting column update...");
        await db.execute('ALTER TABLE profiles MODIFY COLUMN id_image_url LONGTEXT');
        console.log("✅ Successfully updated id_image_url to LONGTEXT in profiles table.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to update column:", error.message);
        process.exit(1);
    }
}

fixColumn();
