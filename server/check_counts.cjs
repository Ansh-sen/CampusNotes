const db = require('./db');

async function count() {
    try {
        const userId = 'ef162798-277b-4768-923a-87a96c001dd1';
        const [all] = await db.execute('SELECT COUNT(*) as count FROM listings');
        const [avail] = await db.execute('SELECT COUNT(*) as count FROM listings WHERE status = "available" AND is_draft = FALSE');
        const [notOwn] = await db.execute('SELECT COUNT(*) as count FROM listings WHERE status = "available" AND is_draft = FALSE AND seller_id != ?', [userId]);
        
        console.log({ 
            total_in_db: all[0].count, 
            total_available: avail[0].count, 
            total_not_belonging_to_user: notOwn[0].count 
        });

        // Also check if any listings have branch/semester/programme set
        const [profileCounts] = await db.execute('SELECT COUNT(*) as count FROM listings WHERE branch IS NOT NULL AND semester IS NOT NULL');
        console.log('Listings with branch/semester:', profileCounts[0].count);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

count();
