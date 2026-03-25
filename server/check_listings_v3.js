const db = require('./db');
async function check() {
    try {
        const [cols] = await db.execute('DESCRIBE listings');
        console.log('Listings columns:', JSON.stringify(cols, null, 2));
        
        const [rows] = await db.execute('SELECT id, title, status, approval_status, is_draft FROM listings LIMIT 5');
        console.log('Sample rows:', JSON.stringify(rows, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
