const mysql = require('mysql2/promise');
const config = {host: 'localhost', user: 'root', password: '', database: 'campus_notes'};
async function run() {
    try {
        const db = await mysql.createConnection(config);
        const [rows] = await db.execute('SELECT approval_status, COUNT(*) as count FROM listings GROUP BY approval_status');
        console.log(JSON.stringify(rows));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
