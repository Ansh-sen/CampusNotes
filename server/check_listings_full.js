const db = require('./db');
const fs = require('fs');
async function check() {
    let output = '';
    try {
        const [cols] = await db.execute('DESCRIBE listings');
        cols.forEach(c => {
            output += `${c.Field}: ${c.Type} (${c.Null}, ${c.Key}, ${c.Default}, ${c.Extra})\n`;
        });
        fs.writeFileSync('listings_schema_full.txt', output);
        console.log('Listings schema written to listings_schema_full.txt');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        process.exit();
    }
}
check();
