const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { parse } = require('csv-parse');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const adminAuth = require('../middleware/adminAuth');

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your_admin_secret_key_here';

// --- Admin Auth Routes ---

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    try {
        const [admins] = await db.execute('SELECT * FROM admin_users WHERE email = ?', [email]);
        if (admins.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });

        const admin = admins[0];
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials.' });

        const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, ADMIN_JWT_SECRET, { expiresIn: '24h' });
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db.execute('INSERT INTO admin_sessions (id, admin_id, token, expires_at) VALUES (?, ?, ?, ?)', [uuidv4(), admin.id, token, expiresAt]);
        res.json({ token, admin: { id: admin.id, name: admin.name, email: admin.email } });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.post('/logout', adminAuth, async (req, res) => {
    try {
        await db.execute('DELETE FROM admin_sessions WHERE token = ?', [req.adminToken]);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.get('/me', adminAuth, (req, res) => res.json(req.admin));

// --- Stats ---

router.get('/stats', adminAuth, async (req, res) => {
    try {
        const query = `
            SELECT 
                (SELECT COUNT(*) FROM profiles) as total_users,
                (SELECT COUNT(*) FROM profiles WHERE verification_status = 'pending') as pending_verifications,
                (SELECT COUNT(*) FROM listings WHERE approval_status = 'pending_approval' AND is_draft = false) as pending_listings,
                (SELECT COUNT(*) FROM listings WHERE approval_status = 'approved' AND status = 'available') as active_listings,
                (SELECT COUNT(*) FROM profiles WHERE is_blocked = true) as blocked_users,
                (SELECT COALESCE(SUM(price), 0) FROM listings WHERE status = 'sold') as total_revenue,
                (SELECT COUNT(*) FROM listings WHERE status = 'sold' AND created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)) as sales_this_week
        `;
        const [rows] = await db.execute(query);
        const stats = rows[0];

        // Fetch recent pending verifications
        const [recentVerifications] = await db.execute(`
            SELECT id, full_name as name, programme, branch, created_at 
            FROM profiles 
            WHERE verification_status = 'pending' 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        res.json({
            ...stats,
            recent_verifications: recentVerifications,
            system: {
                uptime: process.uptime(),
                memory: process.memoryUsage().heapUsed,
                db_status: 'Connected'
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// --- Users ---

router.get('/users', adminAuth, async (req, res) => {
    const { status = 'all', search = '', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    if (status !== 'all') {
        if (status === 'blocked') whereClause += ' AND is_blocked = true';
        else { whereClause += ' AND verification_status = ?'; params.push(status); }
    }
    if (search) {
        whereClause += ' AND (full_name LIKE ? OR email LIKE ? OR enrollment_number LIKE ?)';
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
    }
    try {
        const [users] = await db.query(`SELECT id, full_name as name, email, programme, branch, semester, verification_status, enrollment_number, is_blocked, total_sales, rating_avg as avg_rating, created_at FROM profiles ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
        const [totalRows] = await db.query(`SELECT COUNT(*) as total FROM profiles ${whereClause}`, params);
        const total = totalRows[0].total;
        res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.get('/users/:id', adminAuth, async (req, res) => {
    try {
        const [users] = await db.execute('SELECT * FROM profiles WHERE id = ?', [req.params.id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found.' });
        const user = users[0];
        const [verifications] = await db.execute(`SELECT v.*, a.name as admin_name FROM verification_log v JOIN admin_users a ON v.admin_id = a.id WHERE v.user_id = ? ORDER BY v.created_at DESC`, [user.id]);
        const [[stats]] = await db.execute(`SELECT (SELECT COUNT(*) FROM listings WHERE seller_id = ?) as total_listings, (SELECT COUNT(*) FROM listings WHERE seller_id = ? AND status = 'sold') as total_sales, (SELECT COUNT(*) FROM reviews WHERE reviewee_id = ?) as total_reviews`, [user.id, user.id, user.id]);
        res.json({ ...user, verifications, stats });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.patch('/users/:id/block', adminAuth, async (req, res) => {
    try {
        await db.execute('UPDATE profiles SET is_blocked = true WHERE id = ?', [req.params.id]);
        res.json({ message: 'User blocked' });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.patch('/users/:id/unblock', adminAuth, async (req, res) => {
    try {
        await db.execute('UPDATE profiles SET is_blocked = false WHERE id = ?', [req.params.id]);
        res.json({ message: 'User unblocked' });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const userId = req.params.id;
        await connection.execute('DELETE FROM listings WHERE seller_id = ?', [userId]);
        await connection.execute('DELETE FROM messages WHERE sender_id = ? OR recipient_id = ?', [userId, userId]);
        await connection.execute('DELETE FROM reviews WHERE reviewer_id = ? OR reviewee_id = ?', [userId, userId]);
        await connection.execute('DELETE FROM bookmarks WHERE user_id = ?', [userId]);
        await connection.execute('DELETE FROM profiles WHERE id = ?', [userId]);
        await connection.commit();
        res.json({ message: 'User deleted' });
    } catch (error) { await connection.rollback(); res.status(500).json({ error: 'Delete failed' }); } finally { connection.release(); }
});

// --- Verifications ---

router.get('/verifications/pending', adminAuth, async (req, res) => {
    const { search = '', programme = '', branch = '' } = req.query;
    let whereClause = "WHERE verification_status = 'pending'";
    const params = [];

    if (search) {
        whereClause += ' AND (full_name LIKE ? OR email LIKE ? OR enrollment_number LIKE ?)';
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam);
    }
    if (programme) {
        whereClause += ' AND programme = ?';
        params.push(programme);
    }
    if (branch) {
        whereClause += ' AND branch = ?';
        params.push(branch);
    }

    try {
        const [rows] = await db.execute(`SELECT id, full_name as name, email, enrollment_number, id_image_url, programme, branch, semester, created_at FROM profiles ${whereClause} ORDER BY created_at ASC`, params);
        res.json(rows);
    } catch (error) { 
        console.error('Pending verifications error:', error);
        res.status(500).json({ error: 'Internal server error.' }); 
    }
});

router.get('/verifications/history', adminAuth, async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                v.id, 
                v.action, 
                v.reason, 
                v.created_at,
                p.full_name as user_name,
                p.email as user_email,
                p.enrollment_number,
                a.name as admin_name
            FROM verification_log v
            JOIN profiles p ON v.user_id = p.id
            JOIN admin_users a ON v.admin_id = a.id
            ORDER BY v.created_at DESC
            LIMIT 100
        `);
        res.json(rows);
    } catch (error) { 
        console.error('Verifications history error:', error);
        res.status(500).json({ error: 'Internal server error.' }); 
    }
});

router.post('/verifications/:userId/approve', adminAuth, async (req, res) => {
    try {
        const userId = req.params.userId;
        await db.execute('UPDATE profiles SET verification_status = "verified", is_student_verified = 1, verified_at = NOW() WHERE id = ?', [userId]);
        await db.execute('INSERT INTO verification_log (user_id, admin_id, action) VALUES (?, ?, "approved")', [userId, req.admin.id]);
        await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, "Your student ID has been verified.")', [userId]);
        res.json({ message: 'Approved' });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.post('/verifications/:userId/reject', adminAuth, async (req, res) => {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason required' });
    try {
        const userId = req.params.userId;
        await db.execute('UPDATE profiles SET verification_status = "rejected", is_student_verified = 0, verification_rejected_reason = ? WHERE id = ?', [reason, userId]);
        await db.execute('INSERT INTO verification_log (user_id, admin_id, action, reason) VALUES (?, ?, "rejected", ?)', [userId, req.admin.id, reason]);
        await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [userId, `Rejected: ${reason}`]);
        res.json({ message: 'Rejected' });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.post('/verifications/approve-all', adminAuth, async (req, res) => {
    try {
        const [pending] = await db.execute('SELECT id FROM profiles WHERE verification_status = "pending"');
        if (pending.length === 0) return res.json({ message: 'No pending verifications', count: 0 });

        const userIds = pending.map(p => p.id);
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            const placeholders = userIds.map(() => '?').join(',');
            await connection.execute(`UPDATE profiles SET verification_status = "verified", is_student_verified = 1, verified_at = NOW() WHERE id IN (${placeholders})`, userIds);
            
            for (const userId of userIds) {
                await connection.execute('INSERT INTO verification_log (user_id, admin_id, action) VALUES (?, ?, "approved")', [userId, req.admin.id]);
                await connection.execute('INSERT INTO notifications (user_id, message) VALUES (?, "Your student ID has been verified.")', [userId]);
            }

            await connection.commit();
            res.json({ message: `Approved ${userIds.length} verifications`, count: userIds.length });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) { 
        console.error('Bulk approval error:', error);
        res.status(500).json({ error: 'Internal server error.' }); 
    }
});

// --- Listings ---

router.get('/listings/pending', adminAuth, async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT l.*, p.full_name as seller_name, p.email as seller_email FROM listings l JOIN profiles p ON l.seller_id = p.id WHERE l.approval_status = 'pending_approval' AND l.is_draft = false ORDER BY l.created_at ASC`);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.get('/listings', adminAuth, async (req, res) => {
    const { 
        status = 'all', 
        search = '', 
        programme = '', 
        branch = '', 
        material_type = '',
        page = 1, 
        limit = 20 
    } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status !== 'all') { whereClause += ' AND approval_status = ?'; params.push(status); }
    if (search) { whereClause += ' AND (title LIKE ? OR subject LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (programme) { whereClause += ' AND programme = ?'; params.push(programme); }
    if (branch) { whereClause += ' AND branch = ?'; params.push(branch); }
    if (material_type) { whereClause += ' AND material_type = ?'; params.push(material_type); }

    try {
        const [listings] = await db.query(`SELECT l.*, p.full_name as seller_name FROM listings l LEFT JOIN profiles p ON l.seller_id = p.id ${whereClause} ORDER BY l.created_at DESC LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
        const [totalRows] = await db.query(`SELECT COUNT(*) as total FROM listings ${whereClause}`, params);
        const total = totalRows[0].total;
        res.json({ listings, total });
    } catch (error) {
        console.error('Listings error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.post('/listings/:id/approve', adminAuth, async (req, res) => {
    try {
        await db.execute('UPDATE listings SET approval_status = "approved", status = "available", approved_at = NOW(), approved_by = ? WHERE id = ?', [req.admin.id, req.params.id]);
        await db.execute('INSERT INTO listing_approval_log (listing_id, admin_id, action) VALUES (?, ?, "approved")', [req.params.id, req.admin.id]);
        res.json({ message: 'Approved' });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.post('/listings/:id/reject', adminAuth, async (req, res) => {
    const { reason } = req.body;
    try {
        await db.execute('UPDATE listings SET approval_status = "rejected", rejection_reason = ? WHERE id = ?', [reason, req.params.id]);
        await db.execute('INSERT INTO listing_approval_log (listing_id, admin_id, action, reason) VALUES (?, ?, "rejected", ?)', [req.params.id, req.admin.id, reason]);
        res.json({ message: 'Rejected' });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.post('/listings/approve-all', adminAuth, async (req, res) => {
    try {
        const [pending] = await db.execute('SELECT id, seller_id FROM listings WHERE approval_status = "pending_approval" AND is_draft = false');
        if (pending.length === 0) return res.json({ message: 'No pending listings', count: 0 });

        const listingIds = pending.map(l => l.id);
        const connection = await db.getConnection();
        await connection.beginTransaction();
        try {
            const placeholders = listingIds.map(() => '?').join(',');
            await connection.execute(`UPDATE listings SET approval_status = "approved", status = "available", approved_at = NOW(), approved_by = ? WHERE id IN (${placeholders})`, [req.admin.id, ...listingIds]);
            
            for (const listing of pending) {
                await connection.execute('INSERT INTO listing_approval_log (listing_id, admin_id, action) VALUES (?, ?, "approved")', [listing.id, req.admin.id]);
                await connection.execute('INSERT INTO notifications (user_id, message, listing_id) VALUES (?, ?, ?)', [listing.seller_id, "Your listing has been approved and is now live.", listing.id]);
            }

            await connection.commit();
            res.json({ message: `Approved ${listingIds.length} listings`, count: listingIds.length });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) { 
        console.error('Bulk listing approval error:', error);
        res.status(500).json({ error: 'Internal server error.' }); 
    }
});

// --- Academic CRUD ---

router.get('/academic/programmes', adminAuth, async (req, res) => {
    try {
        const [rows] = await db.execute(`SELECT p.*, (SELECT COUNT(*) FROM academic_branches b WHERE b.programme_id = p.id) as branch_count FROM academic_programmes p`);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.post('/academic/programmes', adminAuth, async (req, res) => {
    const { name, code } = req.body;
    try {
        const [reslt] = await db.execute('INSERT INTO academic_programmes (name, code) VALUES (?, ?)', [name, code]);
        res.json({ id: reslt.insertId, name, code });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.delete('/academic/programmes/:id', adminAuth, async (req, res) => {
    try {
        await db.execute('DELETE FROM academic_programmes WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

// Branches
router.get('/academic/branches', adminAuth, async (req, res) => {
    const { programme_id } = req.query;
    try {
        const [rows] = await db.execute('SELECT * FROM academic_branches WHERE programme_id = ?', [programme_id]);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.post('/academic/branches', adminAuth, async (req, res) => {
    const { name, code, programme_id } = req.body;
    try {
        const [reslt] = await db.execute('INSERT INTO academic_branches (name, code, programme_id) VALUES (?, ?, ?)', [name, code, programme_id]);
        res.json({ id: reslt.insertId, name, code, programme_id });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

// Subjects
router.get('/academic/subjects', adminAuth, async (req, res) => {
    const { branch_id, semester } = req.query;
    try {
        const [rows] = await db.execute('SELECT * FROM academic_subjects WHERE branch_id = ? AND semester = ?', [branch_id, semester]);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.post('/academic/subjects', adminAuth, async (req, res) => {
    const { branch_id, semester, subject_code, subject_name } = req.body;
    try {
        const [reslt] = await db.execute('INSERT INTO academic_subjects (branch_id, semester, subject_code, subject_name) VALUES (?, ?, ?, ?)', [branch_id, semester, subject_code, subject_name]);
        res.json({ id: reslt.insertId, branch_id, semester, subject_code, subject_name });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.delete('/academic/branches/:id', adminAuth, async (req, res) => {
    try {
        await db.execute('DELETE FROM academic_branches WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

router.delete('/academic/subjects/:id', adminAuth, async (req, res) => {
    try {
        await db.execute('DELETE FROM academic_subjects WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ error: 'Internal server error.' }); }
});

// Bulk Import Subjects via CSV
const multer = require('multer');
const upload = multer({ dest: 'tmp/' });

router.post('/academic/subjects/bulk-import', adminAuth, upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    const results = { imported: 0, failed: 0, errors: [] };
    const fs = require('fs');

    fs.createReadStream(req.file.path)
        .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
        .on('data', async (row) => {
            // Expected: subject_name, subject_code, branch_code, semester, credits, type
            try {
                const [branches] = await db.execute('SELECT id FROM academic_branches WHERE code = ?', [row.branch_code]);
                if (branches.length === 0) throw new Error(`Branch ${row.branch_code} not found`);
                
                await db.execute(
                    'INSERT INTO academic_subjects (branch_id, semester, subject_code, subject_name, credits, type) VALUES (?, ?, ?, ?, ?, ?)',
                    [branches[0].id, row.semester, row.subject_code, row.subject_name, row.credits || 0, row.type || 'Core']
                );
                results.imported++;
            } catch (err) {
                results.failed++;
                results.errors.push({ row: row.subject_code, reason: err.message });
            }
        })
        .on('end', () => {
            fs.unlinkSync(req.file.path);
            res.json(results);
        })
        .on('error', (err) => {
            fs.unlinkSync(req.file.path);
            res.status(500).json({ error: err.message });
        });
});

// GET /admin/reports - Get analytical reports data
router.get('/reports', adminAuth, async (req, res) => {
    try {
        // Generate last 6 months list for padding
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            months.push(d.toLocaleString('en-US', { month: 'short', year: 'numeric' }));
        }

        // User growth
        const [growthRows] = await db.execute(`
            SELECT DATE_FORMAT(created_at, '%b %Y') as month, COUNT(*) as count 
            FROM profiles 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month
        `);

        const userGrowth = months.map(m => {
            const row = growthRows.find(r => r.month === m);
            return { month: m, count: row ? row.count : 0 };
        });

        // Sales by category (handle null material_type)
        const [categorySales] = await db.execute(`
            SELECT COALESCE(NULLIF(material_type, ''), 'General') as name, COUNT(*) as value 
            FROM listings 
            WHERE status = 'sold' 
            GROUP BY name
            ORDER BY value DESC
        `);

        // Popular subjects (filter out null subject_code)
        const [popularSubjects] = await db.execute(`
            SELECT subject_code, COUNT(*) as count 
            FROM listings 
            WHERE subject_code IS NOT NULL AND subject_code != ''
            GROUP BY subject_code 
            ORDER BY count DESC 
            LIMIT 5
        `);

        res.json({
            userGrowth,
            categorySales,
            popularSubjects
        });
    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
