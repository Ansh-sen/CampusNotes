const db = require('./db');
const fs = require('fs');

async function check() {
    try {
        const [listings] = await db.execute('DESCRIBE listings');
        const [profiles] = await db.execute('DESCRIBE profiles');
        
        const schema = {
            listings: listings.map(r => r.Field),
            profiles: profiles.map(r => r.Field)
        };
        
        fs.writeFileSync('db_schema.json', JSON.stringify(schema, null, 2));
        console.log('Schema saved to db_schema.json');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        process.exit();
    }
}

check();
