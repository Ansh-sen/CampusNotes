const db = require('./db');
const fs = require('fs');
async function check() {
    let output = '';
    const tables = [
        'verification_log', 
        'listing_approval_log', 
        'academic_programmes', 
        'academic_branches', 
        'academic_subjects'
    ];
    try {
        for (const table of tables) {
            output += `--- ${table} ---\n`;
            const [cols] = await db.execute(`DESCRIBE ${table}`);
            cols.forEach(c => {
                output += `${c.Field}: ${c.Type} (${c.Null}, ${c.Key}, ${c.Default}, ${c.Extra})\n`;
            });
            output += '\n';
        }
        fs.writeFileSync('extra_admin_schemas.txt', output);
        console.log('Extra schemas written to extra_admin_schemas.txt');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        process.exit();
    }
}
check();
