require('dotenv').config();
const jwt = require('jsonwebtoken');
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your_admin_secret_key_here';
const admin = { id: '0384473f-fcc1-4c8f-9bcf-96a091a98613', email: 'admin@campusnotes.com', role: 'admin' };
const token = jwt.sign(admin, ADMIN_JWT_SECRET, { expiresIn: '24h' });
console.log(token);
process.exit(0);
