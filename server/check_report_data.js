const db = require('./db');
async function check() {
    try {
        const [soldListings] = await db.execute("SELECT COUNT(*) as count FROM listings WHERE status = 'sold'");
        console.log('Sold Listings Count:', soldListings[0].count);
        
        const [totalProfiles] = await db.execute("SELECT COUNT(*) as count FROM profiles");
        console.log('Total Profiles Count:', totalProfiles[0].count);

        const [userGrowth] = await db.execute(`
            SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as count 
            FROM profiles 
            GROUP BY month 
            ORDER BY created_at ASC 
        `);
        console.log('User Growth Data:', userGrowth);

        const [categorySales] = await db.execute(`
            SELECT material_type as name, COUNT(*) as value 
            FROM listings 
            WHERE status = 'sold' 
            GROUP BY material_type
        `);
        console.log('Category Sales Data:', categorySales);

    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        process.exit();
    }
}
check();
