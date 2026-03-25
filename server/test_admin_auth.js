const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const config = {host: 'localhost', user: 'root', password: '', database: 'campus_notes'};
const ADMIN_JWT_SECRET = 'your_admin_jwt_secret_here_change_in_production'; // I checked this in .env earlier

async function run() {
    try {
        const db = await mysql.createConnection(config);
        
        // 1. Simulate Login
        const email = 'admin@campusnotes.com';
        const [admins] = await db.execute('SELECT * FROM admin_users WHERE email = ?', [email]);
        if (admins.length === 0) { console.log('Admin not found'); return; }
        const admin = admins[0];
        
        const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '24h' });
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await db.execute('INSERT INTO admin_sessions (id, admin_id, token, expires_at) VALUES (?, ?, ?, ?)', [uuidv4(), admin.id, token, expiresAt]);
        console.log('Login successful, token generated');

        // 2. Simulate Auth Middleware
        const [sessions] = await db.execute('SELECT * FROM admin_sessions WHERE token = ? AND expires_at > NOW()', [token]);
        if (sessions.length === 0) { console.log('Session invalid/expired'); return; }
        const session = sessions[0];
        
        const [verifiedAdmins] = await db.execute('SELECT id, name, email FROM admin_users WHERE id = ?', [session.admin_id]);
        if (verifiedAdmins.length === 0) {
            console.log('Admin user not found for ID:', session.admin_id);
            return;
        }
        console.log('Auth middleware successful');

        // 3. Simulate Stats Fetch
        const [rows] = await db.execute('SELECT (SELECT COUNT(*) FROM profiles) as total_users');
        console.log('Stats fetch successful:', rows[0]);

        process.exit(0);
    } catch (e) {
        console.error('CRITICAL ERROR:', e);
        process.exit(1);
    }
}
run();
