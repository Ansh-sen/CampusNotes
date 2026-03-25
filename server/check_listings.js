const db = require('./db');
async function check() {
    try {
        const [rows] = await db.execute('SELECT id, title, status, created_at FROM listings ORDER BY created_at DESC LIMIT 10');
        console.log('Last 10 listings:', JSON.stringify(rows, null, 2));
        
        const [pending] = await db.execute('SELECT COUNT(*) as count FROM listings WHERE status = "pending"');
        console.log('Pending listings count:', pending[0].count);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
