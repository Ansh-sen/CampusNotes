const db = require('./db');
const fs = require('fs');
async function check() {
    let output = '';
    try {
        const [users] = await db.execute('SELECT * FROM admin_users');
        output += `admin_users: ${JSON.stringify(users, null, 2)}\n\n`;
        
        const [sessions] = await db.execute('SELECT * FROM admin_sessions');
        output += `admin_sessions: ${JSON.stringify(sessions, null, 2)}\n\n`;
        
        fs.writeFileSync('admin_data_check.txt', output);
        console.log('Data written to admin_data_check.txt');
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        process.exit();
    }
}
check();
