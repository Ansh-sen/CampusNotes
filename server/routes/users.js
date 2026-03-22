const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');

// POST /api/users/:id/block - Block a user
router.post('/:id/block', authenticateToken, async (req, res) => {
    try {
        const blockerId = req.user.id;
        const blockedId = req.params.id;

        await db.execute(
            'INSERT IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)',
            [blockerId, blockedId]
        );

        res.json({ success: true, message: 'User blocked.' });
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ error: 'Failed to block user.' });
    }
});

// POST /api/users/:id/report - Report a user
router.post('/:id/report', authenticateToken, async (req, res) => {
    try {
        const reporterId = req.user.id;
        const reportedId = req.params.id;
        const { reason, details } = req.body;

        await db.execute(
            'INSERT INTO reports (reporter_id, target_id, target_type, reason, details) VALUES (?, ?, ?, ?, ?)',
            [reporterId, reportedId, 'user', reason, details]
        );

        res.json({ success: true, message: 'User reported.' });
    } catch (error) {
        console.error('Error reporting user:', error);
        res.status(500).json({ error: 'Failed to report user.' });
    }
});

// PATCH /api/users/meetups/:id/checkin - Safety Check-in
router.patch('/meetups/:id/checkin', authenticateToken, async (req, res) => {
    try {
        const meetupId = req.params.id;
        const { status } = req.body; // 'completed'

        await db.execute(
            'UPDATE scheduled_meetups SET status = ? WHERE id = ?',
            [status, meetupId]
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

module.exports = router;
