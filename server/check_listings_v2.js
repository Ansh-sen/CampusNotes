const db = require('./db');
async function check() {
    try {
        const [pendingCount] = await db.execute('SELECT COUNT(*) as count FROM listings WHERE status = "pending"');
        console.log('Total pending listings:', pendingCount[0].count);
        
        if (pendingCount[0].count > 0) {
            const [rows] = await db.execute('SELECT id, title, status, created_at FROM listings WHERE status = "pending" LIMIT 5');
            console.log('Pending samples:', JSON.stringify(rows, null, 2));
        }
        
        const [allCounts] = await db.execute('SELECT status, COUNT(*) as count FROM listings GROUP BY status');
        console.log('All status counts:', JSON.stringify(allCounts, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
