const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');
const crypto = require('crypto');

// POST /api/reviews - Submit a review
router.post('/', authenticateToken, async (req, res) => {
    const { listing_id, reviewee_id, rating, comment } = req.body;
    const reviewer_id = req.user.id;

    if (!reviewee_id || !rating) {
        return res.status(400).json({ error: 'Reviewee ID and rating are required.' });
    }

    if (reviewer_id === reviewee_id) {
        return res.status(400).json({ error: 'You cannot rate yourself.' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    try {
        // 1. Verify if a conversation exists for this listing between these users (safety/trust)
        // If listing_id is provided, check for that listing. If not, it's a general user review.
        if (listing_id) {
            const [convs] = await db.execute(
                'SELECT * FROM conversations WHERE listing_id = ? AND (buyer_id = ? OR seller_id = ?) AND (buyer_id = ? OR seller_id = ?)',
                [listing_id, reviewer_id, reviewer_id, reviewee_id, reviewee_id]
            );
            if (convs.length === 0) {
                return res.status(403).json({ error: 'You can only review someone you have interacted with regarding this listing.' });
            }

            // 2. Check for duplicate review for this listing
            const [existing] = await db.execute(
                'SELECT * FROM reviews WHERE listing_id = ? AND reviewer_id = ?',
                [listing_id, reviewer_id]
            );
            if (existing.length > 0) {
                return res.status(400).json({ error: 'You have already reviewed this listing.' });
            }
        }

        // 3. Insert review
        const reviewId = crypto.randomUUID();
        await db.execute(
            'INSERT INTO reviews (id, listing_id, reviewer_id, reviewee_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
            [reviewId, listing_id || null, reviewer_id, reviewee_id, rating, comment || null]
        );

        // 4. Update rating_avg for reviewee
        const [avgRows] = await db.execute(
            'SELECT AVG(rating) as average FROM reviews WHERE reviewee_id = ?',
            [reviewee_id]
        );
        const newAvg = avgRows[0].average || 0;

        await db.execute(
            'UPDATE profiles SET rating_avg = ? WHERE id = ?',
            [newAvg, reviewee_id]
        );

        res.status(201).json({ message: 'Review submitted successfully!', average: newAvg });
    } catch (error) {
        console.error('Error submitting review:', error);
        res.status(500).json({ error: 'Failed to submit review.' });
    }
});

// GET /api/reviews/user/:userId - Get reviews for a user
router.get('/user/:userId', async (req, res) => {
    try {
        const query = `
            SELECT r.*, p.full_name as reviewer_name, p.avatar_url as reviewer_avatar, l.title as listing_title
            FROM reviews r
            JOIN profiles p ON r.reviewer_id = p.id
            LEFT JOIN listings l ON r.listing_id = l.id
            WHERE r.reviewee_id = ?
            ORDER BY r.created_at DESC
        `;
        const [reviews] = await db.execute(query, [req.params.userId]);
        res.json({ data: reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
});

// GET /api/reviews/listing/:listingId - Get reviews for a specific listing
router.get('/listing/:listingId', async (req, res) => {
    try {
        const query = `
            SELECT r.*, p.full_name as reviewer_name, p.avatar_url as reviewer_avatar
            FROM reviews r
            JOIN profiles p ON r.reviewer_id = p.id
            WHERE r.listing_id = ?
            ORDER BY r.created_at DESC
        `;
        const [reviews] = await db.execute(query, [req.params.listingId]);
        res.json({ data: reviews });
    } catch (error) {
        console.error('Error fetching listing reviews:', error);
        res.status(500).json({ error: 'Failed to fetch listing reviews.' });
    }
});

module.exports = router;
