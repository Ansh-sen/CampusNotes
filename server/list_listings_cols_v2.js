const db = require('./db');
const fs = require('fs');
async function check() {
    try {
        const [cols] = await db.execute('SHOW COLUMNS FROM listings');
        const colNames = cols.map(c => c.Field).join(', ');
        fs.writeFileSync('listings_cols.txt', colNames);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
