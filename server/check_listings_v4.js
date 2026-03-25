const db = require('./db');
async function check() {
    try {
        const [pending] = await db.execute('SELECT id, title, seller_id, approval_status, is_draft FROM listings WHERE approval_status = "pending_approval"');
        console.log('Pending listings:', JSON.stringify(pending, null, 2));
        
        for (const list of pending) {
            const [profile] = await db.execute('SELECT id, full_name FROM profiles WHERE id = ?', [list.seller_id]);
            console.log(`Profile for seller_id ${list.seller_id}:`, JSON.stringify(profile, null, 2));
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
