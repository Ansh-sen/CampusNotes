const db = require('./db');
const fs = require('fs');

async function check() {
    try {
        const [profiles] = await db.execute('DESCRIBE profiles');
        fs.writeFileSync('profiles_schema.json', JSON.stringify(profiles, null, 2));
        console.log('Schema saved to profiles_schema.json');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        process.exit();
    }
}

check();
