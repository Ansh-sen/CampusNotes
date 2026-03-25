const db = require('./db');
async function check() {
    try {
        const [cols] = await db.execute('SHOW COLUMNS FROM listings');
        console.log('Columns:', cols.map(c => c.Field).join(', '));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
