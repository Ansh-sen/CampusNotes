const db = require('./db');
async function check() {
    try {
        const [rows] = await db.execute('SHOW TABLES');
        const tables = rows.map(r => Object.values(r)[0]);
        console.log('Tables:', tables);
        console.log('Has admin_users:', tables.includes('admin_users'));
        console.log('Has admin_sessions:', tables.includes('admin_sessions'));
        
        if (tables.includes('admin_users')) {
            const [cols] = await db.execute('DESCRIBE admin_users');
            console.log('admin_users columns:', cols.map(c => c.Field));
            const [count] = await db.execute('SELECT COUNT(*) as count FROM admin_users');
            console.log('admin_users count:', count[0].count);
        }
    } catch (err) {
        console.error('ERROR:', err.message);
    } finally {
        process.exit();
    }
}
check();
