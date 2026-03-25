const db = require('./db');
const fs = require('fs');
async function check() {
    let output = '';
    try {
        const [cols] = await db.execute('DESCRIBE profiles');
        cols.forEach(c => {
            output += `${c.Field}: ${c.Type} (${c.Null}, ${c.Key}, ${c.Default}, ${c.Extra})\n`;
        });
        fs.writeFileSync('profiles_schema.txt', output);
        console.log('Profiles schema written to profiles_schema.txt');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        process.exit();
    }
}
check();
