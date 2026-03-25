require('dotenv').config();
const db = require('./db');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

async function test() {
    try {
        const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your_admin_secret_key_here';
        const adminId = '0384473f-fcc1-4c8f-9bcf-96a091a98613';
        const email = 'admin@campusnotes.com';
        
        const token = jwt.sign({ id: adminId, email: email, role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '1h' });
        const expiresAt = new Date(Date.now() + 3600000);
        
        await db.execute('INSERT INTO admin_sessions (id, admin_id, token, expires_at) VALUES (?, ?, ?, ?)', [uuidv4(), adminId, token, expiresAt]);
        console.log('Session created. Token:', token);
        
        const http = require('http');
        const options = {
          hostname: 'localhost',
          port: 3001,
          path: '/admin/reports',
          method: 'GET',
          headers: { 'Authorization': `Bearer ${token}` }
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            console.log('Response Body:', data);
            process.exit(0);
          });
        });
        req.on('error', (e) => { console.error(e); process.exit(1); });
        req.end();
        
    } catch (err) {
        console.error('ERROR:', err.message);
        process.exit(1);
    }
}
test();
