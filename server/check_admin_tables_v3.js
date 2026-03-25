const db = require('./db');
const fs = require('fs');
async function check() {
    let output = '';
    try {
        const [rows] = await db.execute('SHOW TABLES');
        const tables = rows.map(r => Object.values(r)[0]);
        output += `Tables: ${tables.join(', ')}\n\n`;
        
        for (const table of ['admin_users', 'admin_sessions']) {
            if (tables.includes(table)) {
                output += `--- ${table} ---\n`;
                const [cols] = await db.execute(`DESCRIBE ${table}`);
                cols.forEach(c => {
                    output += `${c.Field}: ${c.Type} (${c.Null}, ${c.Key}, ${c.Default}, ${c.Extra})\n`;
                });
                output += '\n';
            } else {
                output += `Table ${table} is MISSING!\n\n`;
            }
        }
        fs.writeFileSync('admin_schema_v3.txt', output);
        console.log('Schema written to admin_schema_v3.txt');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        process.exit();
    }
}
check();
