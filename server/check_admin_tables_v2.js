const db = require('./db');
async function check() {
    try {
        const [rows] = await db.execute('SHOW TABLES');
        const tables = rows.map(r => Object.values(r)[0]);
        console.log('Tables:', JSON.stringify(tables));
        
        for (const table of ['admin_users', 'admin_sessions']) {
            if (tables.includes(table)) {
                const [cols] = await db.execute(`DESCRIBE ${table}`);
                console.log(`${table} columns:`, cols.map(c => c.Field).join(', '));
            } else {
                console.log(`Table ${table} is MISSING!`);
            }
        }
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        process.exit();
    }
}
check();
