const jwt = require('jsonwebtoken');
const db = require('../db');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your_admin_secret_key_here';

const adminAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        // 1. Verify token with ADMIN_JWT_SECRET
        const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
        
        // 2. Check admin_sessions table
        const [sessions] = await db.execute(
            'SELECT * FROM admin_sessions WHERE token = ? AND expires_at > NOW()',
            [token]
        );

        if (sessions.length === 0) {
            return res.status(401).json({ error: 'Invalid or expired admin session.' });
        }

        const session = sessions[0];

        // 3. Get admin user info
        const [admins] = await db.execute(
            'SELECT id, name, email FROM admin_users WHERE id = ?',
            [session.admin_id]
        );

        if (admins.length === 0) {
            return res.status(401).json({ error: 'Admin user not found.' });
        }

        req.admin = admins[0];
        req.adminToken = token;
        next();
    } catch (error) {
        console.error('Admin Auth Middleware Error:', error);
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = adminAuth;
