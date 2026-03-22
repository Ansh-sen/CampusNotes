const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');

// GET /api/requests/top - Fetch top 5 unfulfilled requests for user's branch/sem
router.get('/top', authenticateToken, async (req, res) => {
    try {
        const { branch, semester, programme } = req.query;
        if (!branch || !semester || !programme) {
            return res.status(400).json({ error: 'Branch, semester, and programme are required.' });
        }

        const query = `
            SELECT id, subject_name, subject_code, upvote_count, is_fulfilled 
            FROM note_requests 
            WHERE branch = ? AND semester = ? AND programme = ? AND is_fulfilled = FALSE
            ORDER BY upvote_count DESC, id DESC 
            LIMIT 5
        `;
        const [requests] = await db.execute(query, [branch, parseInt(semester, 10), programme]);
        res.json({ data: requests });
    } catch (error) {
        console.error('Error fetching top requests:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/requests/by-subject - Fetch unfulfilled request count by subject_code
router.get('/by-subject', authenticateToken, async (req, res) => {
    try {
        const { subject_code } = req.query;
        if (!subject_code) {
            return res.status(400).json({ error: 'subject_code is required.' });
        }

        const [rows] = await db.execute(
            'SELECT COUNT(*) as count FROM note_requests WHERE subject_code = ? AND is_fulfilled = FALSE',
            [subject_code]
        );
        res.json({ count: rows[0].count });
    } catch (error) {
        console.error('Error fetching request count:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/requests - Create a new request
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { subject_name, subject_code, branch, semester, programme, description } = req.body;
        const userId = req.user.id;

        if (!subject_name || !subject_code || !branch || !semester || !programme) {
            return res.status(400).json({ error: 'All fields are required except description.' });
        }

        // Check for duplicate open request
        const [existing] = await db.execute(
            'SELECT id FROM note_requests WHERE subject_code = ? AND branch = ? AND semester = ? AND programme = ? AND is_fulfilled = FALSE',
            [subject_code, branch, parseInt(semester, 10), programme]
        );

        if (existing.length > 0) {
            const requestId = existing[0].id;
            
            // Auto-upvote for this user if not already upvoted
            try {
                await db.execute(
                    'INSERT INTO request_upvotes (request_id, user_id) VALUES (?, ?)',
                    [requestId, userId]
                );
                await db.execute(
                    'UPDATE note_requests SET upvote_count = upvote_count + 1 WHERE id = ?',
                    [requestId]
                );
                return res.json({ message: 'Already requested - your upvote has been added.', id: requestId, upvoted: true });
            } catch (upErr) {
                // Already upvoted
                return res.json({ message: 'Already requested and upvoted.', id: requestId, upvoted: false });
            }
        }

        // Create new request
        const [result] = await db.execute(
            'INSERT INTO note_requests (requester_id, subject_name, subject_code, branch, semester, programme, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, subject_name, subject_code, branch, parseInt(semester, 10), programme, description || null]
        );

        const newRequestId = result.insertId;

        // Upvote for the requester
        await db.execute(
            'INSERT INTO request_upvotes (request_id, user_id) VALUES (?, ?)',
            [newRequestId, userId]
        );
        await db.execute(
            'UPDATE note_requests SET upvote_count = 1 WHERE id = ?',
            [newRequestId]
        );

        res.status(201).json({ message: 'Request posted — sellers will be notified.', id: newRequestId });
    } catch (error) {
        console.error('Error creating request:', error);
        res.status(500).json({ error: 'Failed to create request.' });
    }
});

// POST /api/requests/:id/upvote - Upvote a request
router.post('/:id/upvote', authenticateToken, async (req, res) => {
    try {
        const requestId = req.params.id;
        const userId = req.user.id;

        // Check if already upvoted
        const [existing] = await db.execute(
            'SELECT * FROM request_upvotes WHERE request_id = ? AND user_id = ?',
            [requestId, userId]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'You already requested this.' });
        }

        // Add upvote
        await db.execute(
            'INSERT INTO request_upvotes (request_id, user_id) VALUES (?, ?)',
            [requestId, userId]
        );
        await db.execute(
            'UPDATE note_requests SET upvote_count = upvote_count + 1 WHERE id = ?',
            [requestId]
        );

        res.json({ message: 'Upvoted successfully' });
    } catch (error) {
        console.error('Upvote error:', error);
        res.status(500).json({ error: 'Failed to upvote request.' });
    }
});

module.exports = router;
