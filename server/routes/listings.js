const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');
const { scoreNote } = require('../services/aiScorer');
const { suggestTags } = require('../services/aiHelper');
const { checkDuplicate } = require('../services/duplicateDetector');
const path = require('path');
const fs = require('fs');

const { validateListing } = require('../middleware/validation');

// GET /api/listings - Fetch listings with dynamic filtering and sorting
router.get('/', async (req, res) => {
    try {
        const { 
            programme, branch, semester, subject_code, 
            material_types, min_price, max_price, sort 
        } = req.query;

        let query = `
            SELECT l.*, p.full_name as seller_name, p.avatar_url as seller_avatar, p.is_topper as seller_is_topper, p.is_student_verified as seller_is_verified, p.rating_avg as seller_rating, p.major as seller_major
            FROM listings l 
            JOIN profiles p ON l.seller_id = p.id 
            WHERE l.status = 'available' AND l.is_draft = FALSE AND l.approval_status = 'approved'
        `;
        const params = [];

        // Dynamic Filtering
        if (programme) {
            query += ` AND l.programme = ?`;
            params.push(programme);
        }
        if (branch) {
            query += ` AND l.branch = ?`;
            params.push(branch);
        }
        if (semester) {
            query += ` AND l.semester = ?`;
            params.push(semester);
        }
        if (subject_code) {
            query += ` AND l.subject_code = ?`;
            params.push(subject_code);
        }
        if (material_types) {
            const types = Array.isArray(material_types) ? material_types : material_types.split(',');
            if (types.length > 0) {
                query += ` AND l.material_type IN (${types.map(() => '?').join(',')})`;
                params.push(...types);
            }
        }
        if (min_price) {
            query += ` AND l.price >= ?`;
            params.push(Number(min_price));
        }
        if (max_price) {
            query += ` AND l.price <= ?`;
            params.push(Number(max_price));
        }

        // Sorting
        switch (sort) {
            case 'price_asc':
                query += ` ORDER BY l.price ASC`;
                break;
            case 'price_desc':
                query += ` ORDER BY l.price DESC`;
                break;
            case 'popular':
                query += ` ORDER BY l.view_count DESC`;
                break;
            case 'latest':
            default:
                query += ` ORDER BY l.created_at DESC`;
                break;
        }

        const [listings] = await db.execute(query, params);
        
        for (let listing of listings) {
            const [imgs] = await db.execute('SELECT image_url, is_cover FROM listing_images WHERE listing_id = ? ORDER BY order_index ASC', [listing.id]);
            listing.listing_images = imgs;
            const [tags] = await db.execute('SELECT tag_name FROM listing_tags WHERE listing_id = ?', [listing.id]);
            listing.tags = tags.map(t => t.tag_name);
        }

        res.json({ data: listings, count: listings.length });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ error: 'Failed to fetch listings.' });
    }
});

// GET /api/listings/me - Fetch authenticated user's listings for dashboard
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT l.*, 
                (SELECT COUNT(*) FROM conversations WHERE listing_id = l.id) as inquiry_count,
                (SELECT COUNT(*) FROM bookmarks WHERE listing_id = l.id) as bookmark_count
            FROM listings l
            WHERE l.seller_id = ? 
            ORDER BY l.created_at DESC
        `;
        const [listings] = await db.execute(query, [userId]);
        
        for (let listing of listings) {
            const [imgs] = await db.execute('SELECT image_url, is_cover FROM listing_images WHERE listing_id = ? ORDER BY order_index ASC', [listing.id]);
            listing.listing_images = imgs;
        }

        res.json({ data: listings });
    } catch (error) {
        console.error('Error fetching user listings:', error);
        res.status(500).json({ error: 'Failed to fetch user listings.' });
    }
});

// GET /api/listings/me/stats - Fetch authenticated user's dashboard stats
router.get('/me/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Get listing aggregates
        const listingQuery = `
            SELECT 
                COUNT(*) as total_count,
                COALESCE(SUM(CASE WHEN status = 'available' AND is_draft = FALSE THEN 1 ELSE 0 END), 0) as active_count,
                COALESCE(SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END), 0) as sold_count,
                COALESCE(SUM(CASE WHEN is_draft = TRUE THEN 1 ELSE 0 END), 0) as draft_count,
                COALESCE(SUM(CASE WHEN status = 'sold' THEN price ELSE 0 END), 0) as total_earned
            FROM listings 
            WHERE seller_id = ?
        `;
        const [listingStats] = await db.execute(listingQuery, [userId]);
        const stats = listingStats[0];

        // 2. Get average rating from reviews
        const [reviewStats] = await db.execute(
            'SELECT COALESCE(AVG(rating), 0) as avg_rating FROM reviews WHERE seller_id = ?',
            [userId]
        );
        
        stats.total_earned = stats.total_earned || 0;
        stats.avg_rating = Number(reviewStats[0]?.avg_rating || 0).toFixed(1);
        
        res.json({ data: stats });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats.' });
    }
});

// GET /api/listings/subject/:subject_code - Fetch listings by RGPV subject code
router.get('/subject/:subject_code', async (req, res) => {
    try {
        const { subject_code } = req.params;
        const query = `
            SELECT l.*, p.full_name as seller_name, p.avatar_url as seller_avatar, p.is_topper as seller_is_topper, p.rating_avg as seller_rating, p.major as seller_major
            FROM listings l 
            JOIN profiles p ON l.seller_id = p.id 
            WHERE l.subject_code = ? AND l.status = 'available' AND l.is_draft = FALSE AND l.approval_status = 'approved'
            ORDER BY l.created_at DESC
        `;
        const [listings] = await db.execute(query, [subject_code]);

        for (let listing of listings) {
            const [imgs] = await db.execute('SELECT image_url, is_cover FROM listing_images WHERE listing_id = ? ORDER BY order_index ASC', [listing.id]);
            listing.listing_images = imgs;
            const [tags] = await db.execute('SELECT tag_name FROM listing_tags WHERE listing_id = ?', [listing.id]);
            listing.tags = tags.map(t => t.tag_name);
        }

        res.json({ data: listings });
    } catch (error) {
        console.error('Error fetching listings by subject:', error);
        res.status(500).json({ error: 'Failed to fetch subject listings.' });
    }
});

// GET /api/listings/for-you - Fetch personalized listings for the authenticated user
router.get('/for-you', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch user profile for branch and semester
        const [profiles] = await db.execute('SELECT branch, semester, programme FROM profiles WHERE id = ?', [userId]);
        if (profiles.length === 0) return res.status(404).json({ error: 'User profile not found' });
        
        const { branch, semester, programme } = profiles[0];

        // 1. Fetch personalized results
        let personalQuery = `
            SELECT l.*, p.full_name as seller_name, p.avatar_url as seller_avatar, p.is_topper as seller_is_topper, p.is_student_verified as seller_is_verified, p.rating_avg as seller_rating, p.major as seller_major
            FROM listings l
            JOIN profiles p ON l.seller_id = p.id
            LEFT JOIN purchases pur ON l.id = pur.listing_id AND pur.buyer_id = ?
            WHERE l.status = 'available' 
              AND l.is_draft = FALSE 
              AND l.approval_status = 'approved'
              AND l.seller_id != ?
              AND pur.id IS NULL
        `;
        
        const params = [userId, userId];
        
        if (branch && semester && programme) {
            personalQuery += ` AND l.branch = ? AND l.semester = ? AND l.programme = ?`;
            params.push(branch, semester, programme);
        } else {
            // If no profile, we can't do personalization, but we return early to backfill
            personalQuery += ` AND 1=0 `; 
        }

        personalQuery += ` ORDER BY l.ai_score DESC, l.view_count DESC, l.created_at DESC LIMIT 10`;

        let [personalizedListings] = await db.execute(personalQuery, params);

        // 2. Backfill if less than 5 results
        if (personalizedListings.length < 5) {
            const excludeIds = personalizedListings.map(l => l.id);
            let backfillQuery = `
                SELECT l.*, p.full_name as seller_name, p.avatar_url as seller_avatar, p.is_topper as seller_is_topper, p.is_student_verified as seller_is_verified, p.rating_avg as seller_rating, p.major as seller_major
                FROM listings l
                JOIN profiles p ON l.seller_id = p.id
                LEFT JOIN purchases pur ON l.id = pur.listing_id AND pur.buyer_id = ?
                WHERE l.status = 'available' 
                  AND l.is_draft = FALSE 
                  AND l.seller_id != ?
                  AND l.approval_status = 'approved'
                  AND pur.id IS NULL
            `;
            const backfillParams = [userId, userId];

            if (excludeIds.length > 0) {
                backfillQuery += ` AND l.id NOT IN (${excludeIds.map(() => '?').join(',')})`;
                backfillParams.push(...excludeIds);
            }

            const limitCount = 10 - personalizedListings.length;
            backfillQuery += ` ORDER BY l.created_at DESC LIMIT ${limitCount}`;

            const [backfill] = await db.execute(backfillQuery, backfillParams);
            personalizedListings = [...personalizedListings, ...backfill];
        }

        // Enrich with images and tags
        for (let listing of personalizedListings) {
            const [imgs] = await db.execute('SELECT image_url, is_cover FROM listing_images WHERE listing_id = ? ORDER BY order_index ASC', [listing.id]);
            listing.listing_images = imgs;
            const [tags] = await db.execute('SELECT tag_name FROM listing_tags WHERE listing_id = ?', [listing.id]);
            listing.tags = tags.map(t => t.tag_name);
        }

        res.json({ data: personalizedListings });
    } catch (error) {
        console.error('Error fetching for-you listings:', error);
        res.status(500).json({ error: 'Failed to fetch personalized listings.' });
    }
});

// GET /api/listings/trending - Fetch top 5 trending listings in last 7 days
router.get('/trending', async (req, res) => {
    try {
        const query = `
            SELECT l.*, p.full_name as seller_name, p.avatar_url as seller_avatar, p.is_topper as seller_is_topper, p.is_student_verified as seller_is_verified, p.rating_avg as seller_rating, p.major as seller_major
            FROM listings l
            JOIN profiles p ON l.seller_id = p.id
            WHERE l.status = 'available' AND l.is_draft = FALSE
            ORDER BY l.view_count DESC, l.created_at DESC
            LIMIT 5
        `;
        const [listings] = await db.execute(query);
        
        // Enrich images
        for (let listing of listings) {
            const [imgs] = await db.execute('SELECT image_url, is_cover FROM listing_images WHERE listing_id = ? ORDER BY order_index ASC', [listing.id]);
            listing.listing_images = imgs;
        }

        res.json({ data: listings });
    } catch (error) {
        console.error('Error fetching trending listings:', error);
        res.status(500).json({ error: 'Failed to fetch trending listings.' });
    }
});

// GET /api/listings/my-draft - Fetch the latest draft for the user
router.get('/my-draft', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT * FROM listings 
            WHERE seller_id = ? AND is_draft = TRUE 
            ORDER BY created_at DESC LIMIT 1
        `;
        const [drafts] = await db.execute(query, [userId]);
        
        if (drafts.length === 0) return res.json({ data: null });
        
        const draft = drafts[0];
        const [imgs] = await db.execute('SELECT image_url, is_cover FROM listing_images WHERE listing_id = ? ORDER BY order_index ASC', [draft.id]);
        draft.listing_images = imgs;
        
        const [tags] = await db.execute('SELECT tag_name FROM listing_tags WHERE listing_id = ?', [draft.id]);
        draft.tags = tags.map(t => t.tag_name);
        
        res.json({ data: draft });
    } catch (error) {
        console.error('Error fetching draft:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/listings/draft - Save or update a draft
router.post('/draft', authenticateToken, validateListing, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id, title, description, subject_code, semester, branch, programme, material_type, price, images, tags } = req.body;
        
        let listingId = id || null; // Normalize empty string to null
        if (!listingId) {
            listingId = crypto.randomUUID();
            await db.execute(
                `INSERT INTO listings (id, seller_id, title, description, subject_code, semester, branch, programme, material_type, price, is_draft, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'draft')`,
                [listingId, userId, title || 'Untitled Draft', description || null, subject_code || null, semester || null, branch || null, programme || null, material_type || null, price || 0]
            );
        } else {
            await db.execute(
                `UPDATE listings SET title = ?, description = ?, subject_code = ?, semester = ?, branch = ?, programme = ?, material_type = ?, price = ? 
                 WHERE id = ? AND seller_id = ?`,
                [title || 'Untitled Draft', description || null, subject_code || null, semester || null, branch || null, programme || null, material_type || null, price || 0, listingId, userId]
            );
        }

        // Update images and tags (simplification: clear and re-insert)
        await db.execute('DELETE FROM listing_images WHERE listing_id = ?', [listingId]);
        if (images && Array.isArray(images)) {
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                if (img && img.url) { // Safety check
                    await db.execute(
                        'INSERT INTO listing_images (listing_id, image_url, is_cover, order_index) VALUES (?, ?, ?, ?)',
                        [listingId, img.url, img.is_cover || (i === 0), i]
                    );
                }
            }
        }

        await db.execute('DELETE FROM listing_tags WHERE listing_id = ?', [listingId]);
        if (tags && Array.isArray(tags)) {
            for (const tag of tags) {
                if (tag) { // Safety check
                    await db.execute('INSERT INTO listing_tags (listing_id, tag_name) VALUES (?, ?)', [listingId, tag]);
                }
            }
        }

        res.json({ success: true, id: listingId });
    } catch (error) {
        console.error('CRITICAL ERROR saving draft:', error);
        res.status(500).json({ error: 'Failed to save draft', details: error.message, stack: error.stack });
    }
});

// POST /api/listings/suggest-tags - AI Tag Suggestions
router.post('/suggest-tags', authenticateToken, async (req, res) => {
    try {
        const { subject_name, material_type, programme, branch, semester } = req.body;
        const tags = await suggestTags({ subject_name, material_type, programme, branch, semester });
        res.json({ tags: tags || [] });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/listings/check-duplicate - Perceptual Hash Duplicate Detection
router.post('/check-duplicate', authenticateToken, async (req, res) => {
    try {
        const { image_url } = req.body; // URL from /api/messages/upload
        if (!image_url) return res.status(400).json({ error: 'image_url required' });

        // SECURITY: Prevent Path Traversal
        // Ensure image_url only refers to a file within the uploads directory
        const filename = path.basename(image_url);
        const absolutePath = path.join(__dirname, '../uploads', filename);

        // Double check the path is still within uploads/
        if (!absolutePath.startsWith(path.join(__dirname, '../uploads'))) {
            return res.status(403).json({ error: 'Invalid file path' });
        }

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({ error: 'Image file not found' });
        }

        const result = await checkDuplicate(absolutePath);
        res.json(result);
    } catch (error) {
        console.error('Duplicate detection error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/listings/price-range - Smart Pricing Suggestions
router.get('/price-range', authenticateToken, async (req, res) => {
    try {
        const { subject_code, material_type } = req.query;
        if (!subject_code) return res.status(400).json({ error: 'subject_code required' });

        const [rows] = await db.execute(
            'SELECT price FROM listings WHERE subject_code = ? AND material_type = ? AND is_draft = FALSE AND status = "available"',
            [subject_code, material_type]
        );

        if (rows.length === 0) {
            return res.json({ min: 10, max: 200, median: 50, count: 0 });
        }

        const prices = rows.map(r => r.price).sort((a, b) => a - b);
        const min = prices[0];
        const max = prices[prices.length - 1];
        const median = prices[Math.floor(prices.length / 2)];

        res.json({ min, max, median, count: prices.length });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// POST /api/listings/score-test - AI Scoring for preview
router.post('/score-test', authenticateToken, async (req, res) => {
    try {
        const { image_url } = req.body;
        if (!image_url) return res.status(400).json({ error: 'image_url required' });

        const result = await scoreNote(image_url);
        res.json(result || { score: 0, reasons: ['Scoring failed or image not clear enough.'] });
    } catch (error) {
        console.error('Score test error:', error);
        res.status(500).json({ error: 'Failed' });
    }
});

// GET /api/listings/:id - Fetch a specific listing
router.get('/:id', async (req, res) => {
    try {
        const listingId = req.params.id;
        const viewerId = req.query.viewer_id || null; // Optional from client
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        // View tracking logic: Prevent multiple views from same user/IP in 24 hours
        try {
            const [recentViews] = await db.execute(
                `SELECT id FROM listing_views 
                 WHERE listing_id = ? AND (viewer_id = ? OR ip_address = ?) 
                 AND viewed_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`,
                [listingId, viewerId, ipAddress]
            );

            if (recentViews.length === 0) {
                // Log view and increment count
                await db.execute(
                    'INSERT INTO listing_views (listing_id, viewer_id, ip_address) VALUES (?, ?, ?)',
                    [listingId, viewerId, ipAddress]
                );
                await db.execute('UPDATE listings SET view_count = view_count + 1 WHERE id = ?', [listingId]);
            }
        } catch (viewErr) {
            console.error('View tracking failed silently:', viewErr);
        }

        const query = `
            SELECT l.*, p.full_name as seller_name, p.avatar_url as seller_avatar, p.is_topper as seller_is_topper, p.is_student_verified as seller_is_verified, p.rating_avg as seller_rating, p.major as seller_major
            FROM listings l 
            JOIN profiles p ON l.seller_id = p.id 
            WHERE l.id = ?
        `;
        const [listings] = await db.execute(query, [listingId]);

        if (listings.length === 0) {
            return res.status(404).json({ error: 'Listing not found.' });
        }

        const listing = listings[0];
        const [imgs] = await db.execute('SELECT image_url, is_cover, order_index FROM listing_images WHERE listing_id = ? ORDER BY order_index ASC', [listing.id]);
        listing.listing_images = imgs;
        
        const [tags] = await db.execute('SELECT tag_name FROM listing_tags WHERE listing_id = ?', [listing.id]);
        listing.tags = tags.map(t => t.tag_name);

        res.json({ data: listing });
    } catch (error) {
        console.error('Error fetching listing:', error);
        res.status(500).json({ error: 'Failed to fetch listing details.' });
    }
});

const crypto = require('crypto');

// POST /api/listings - Create a new listing (Protected Route)
router.post('/', authenticateToken, validateListing, async (req, res) => {
    const { 
        id, title, description, price, material_type,
        images, tags, is_draft, file_url,
        programme, branch, semester, 
        subject_code, subject_name 
    } = req.body;
    
    const seller_id = req.user.id; 

    // Check verification status
    try {
        const [profiles] = await db.execute('SELECT verification_status FROM profiles WHERE id = ?', [seller_id]);
        if (profiles.length === 0 || profiles[0].verification_status !== 'verified') {
            return res.status(403).json({ 
                error: 'verification_required', 
                message: 'Verify your student ID to list notes.' 
            });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Failed to verify status' });
    }

    const listingId = id || crypto.randomUUID();
    const isUpdate = !!id;

    if (!title) {
        return res.status(400).json({ error: 'Title is required.' });
    }

    try {
        if (isUpdate) {
            // Update existing listing (usually converting a draft to a live listing)
            await db.execute(
                `UPDATE listings SET 
                    title = ?, description = ?, price = ?, 
                    programme = ?, branch = ?, semester = ?, subject_code = ?, subject = ?,
                    material_type = ?, is_draft = FALSE, status = 'pending', file_url = ?, 
                    approval_status = 'pending_approval'
                 WHERE id = ? AND seller_id = ?`,
                [
                    title, description || null, price || 0,
                    programme || null, branch || null, semester ? semester.toString() : null, 
                    subject_code || null, subject_name || null,
                    material_type || null, file_url || null,
                    listingId, seller_id
                ]
            );
            // Clear existing images and tags for this listing to avoid duplicates on re-insertion
            await db.execute('DELETE FROM listing_images WHERE listing_id = ?', [listingId]);
            await db.execute('DELETE FROM listing_tags WHERE listing_id = ?', [listingId]);
        } else {
            // 1. Insert new listing
            await db.execute(
                `INSERT INTO listings (
                    id, seller_id, title, description, price, 
                    programme, branch, semester, subject_code, subject,
                    material_type, is_draft, status, file_url, approval_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, 'pending', ?, 'pending_approval')`,
                [
                    listingId, seller_id, title, description || null, price || 0,
                    programme || null, branch || null, semester ? semester.toString() : null, 
                    subject_code || null, subject_name || null,
                    material_type || null, file_url || null
                ]
            );
        }

        // 2. Insert images (new or replaced)
        if (images && Array.isArray(images)) {
            for (let i = 0; i < images.length; i++) {
                const img = images[i];
                await db.execute(
                    `INSERT INTO listing_images (listing_id, image_url, is_cover, order_index) VALUES (?, ?, ?, ?)`,
                    [listingId, img.url || img.image_url, img.is_cover || (i === 0), i]
                );
            }
        }

        // 3. Insert tags (new or replaced)
        if (tags && Array.isArray(tags)) {
            for (const tag of tags) {
                await db.execute(
                    `INSERT INTO listing_tags (listing_id, tag_name) VALUES (?, ?)`,
                    [listingId, tag]
                );
            }
        }

        res.status(isUpdate ? 200 : 201).json({ 
            message: isUpdate ? 'Listing updated and published!' : 'Listing created successfully!', 
            id: listingId 
        });

        // Background tasks
        (async () => {
            try {
                // 1. AI Scoring
                if (images && images.length > 0) {
                    const firstImage = images[0].url || images[0].image_url;
                    const result = await scoreNote(firstImage);
                    if (result) {
                        await db.execute(
                            'UPDATE listings SET ai_score = ?, ai_reasons = ? WHERE id = ?',
                            [result.score, JSON.stringify(result.reasons), listingId]
                        );
                    }
                }

                // 2. Fulfillment check
                if (subject_code) {
                    const [requests] = await db.execute(
                        'SELECT id, requester_id FROM note_requests WHERE subject_code = ? AND semester = ? AND is_fulfilled = FALSE',
                        [subject_code, semester]
                    );

                    for (const req_data of requests) {
                        // Mark as fulfilled
                        await db.execute('UPDATE note_requests SET is_fulfilled = TRUE WHERE id = ?', [req_data.id]);
                        
                        // Send notification
                        await db.execute(
                            'INSERT INTO notifications (user_id, message, listing_id) VALUES (?, ?, ?)',
                            [req_data.requester_id, `Notes for your requested subject (${subject_code}) are now available.`, listingId]
                        );
                    }
                }
            } catch (bgErr) {
                console.error('Background task error:', bgErr);
            }
        })();

    } catch (error) {
        console.error('CRITICAL: Error creating listing:', error);
        console.error('Request Body:', JSON.stringify(req.body, null, 2));
        res.status(500).json({ error: 'Failed to create listing.', details: error.message });
    }
});

// PUT /api/listings/:id - Update a listing
router.put('/:id', authenticateToken, async (req, res) => {
    const { title, status, price, file_url } = req.body;
    const listingId = req.params.id;
    const sellerId = req.user.id;

    try {
        // Verify ownership
        const [listings] = await db.execute('SELECT * FROM listings WHERE id = ? AND seller_id = ?', [listingId, sellerId]);
        if (listings.length === 0) {
            return res.status(403).json({ error: 'Permission denied or listing not found.' });
        }

        const { 
            title, description, price, status, material_type,
            programme, branch, semester, subject_code, subject_name,
            file_url, images, tags 
        } = req.body;

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update main listing table
            await connection.execute(
                `UPDATE listings SET 
                    title = ?, description = ?, price = ?, status = ?, material_type = ?,
                    programme = ?, branch = ?, semester = ?, subject_code = ?, subject = ?,
                    file_url = ?
                 WHERE id = ? AND seller_id = ?`,
                [
                    title, description || null, price || 0, status || 'available', material_type || null,
                    programme || null, branch || null, semester || null, subject_code || null, subject_name || null,
                    file_url || null, listingId, sellerId
                ]
            );

            // Update images (clear and re-insert)
            if (images && Array.isArray(images)) {
                await connection.execute('DELETE FROM listing_images WHERE listing_id = ?', [listingId]);
                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    await connection.execute(
                        'INSERT INTO listing_images (listing_id, image_url, is_cover, order_index) VALUES (?, ?, ?, ?)',
                        [listingId, img.url || img.image_url, img.is_cover || (i === 0), i]
                    );
                }
            }

            // Update tags (clear and re-insert)
            if (tags && Array.isArray(tags)) {
                await connection.execute('DELETE FROM listing_tags WHERE listing_id = ?', [listingId]);
                for (const tag of tags) {
                    await connection.execute('INSERT INTO listing_tags (listing_id, tag_name) VALUES (?, ?)', [listingId, tag]);
                }
            }

            await connection.commit();
            res.json({ message: 'Listing updated successfully!', success: true });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error updating listing:', error);
        res.status(500).json({ error: 'Failed to update listing.' });
    }
});

// DELETE /api/listings/me/drafts/all - Clear all drafts for the user
router.delete('/me/drafts/all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Use a transaction to clean up images and tags for all drafts
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Find all draft IDs
            const [drafts] = await connection.execute('SELECT id FROM listings WHERE seller_id = ? AND is_draft = TRUE', [userId]);
            const draftIds = drafts.map(d => d.id);

            if (draftIds.length > 0) {
                // Bulk delete related records
                const placeHolders = draftIds.map(() => '?').join(',');
                await connection.execute(`DELETE FROM listing_images WHERE listing_id IN (${placeHolders})`, draftIds);
                await connection.execute(`DELETE FROM listing_tags WHERE listing_id IN (${placeHolders})`, draftIds);
                await connection.execute(`DELETE FROM listings WHERE id IN (${placeHolders})`, draftIds);
            }

            await connection.commit();
            res.json({ success: true, message: 'All drafts cleared successfully.' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error clearing drafts:', error);
        res.status(500).json({ error: 'Failed to clear drafts' });
    }
});

// PATCH /api/listings/:id/status - Update specific listing status (active, paused, sold)
router.patch('/:id/status', authenticateToken, async (req, res) => {
    const { status } = req.body;
    const listingId = req.params.id;
    const sellerId = req.user.id;

    if (!['available', 'paused', 'sold'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const [listings] = await db.execute('SELECT * FROM listings WHERE id = ? AND seller_id = ?', [listingId, sellerId]);
        if (listings.length === 0) return res.status(404).json({ error: 'Listing not found' });

        await db.execute('UPDATE listings SET status = ? WHERE id = ?', [status, listingId]);

        // Gamification: Update to Verified Topper if thresholds met after a sale
        if (status === 'sold') {
            const [sales] = await db.execute('SELECT COUNT(*) as count FROM listings WHERE seller_id = ? AND status = "sold"', [sellerId]);
            const [rating] = await db.execute('SELECT AVG(rating) as avg FROM reviews WHERE reviewee_id = ?', [sellerId]);
            
            const totalSales = sales[0].count;
            const avgRating = Number(rating[0].avg || 0);

            if (totalSales >= 10 && avgRating >= 4.5) {
                await db.execute('UPDATE profiles SET is_topper = TRUE WHERE id = ?', [sellerId]);
            }
        }

        res.json({ success: true, message: `Listing marked as ${status}` });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// POST /api/listings/:id/relist - Duplicate and activate a listing
router.post('/:id/relist', authenticateToken, async (req, res) => {
    const listingId = req.params.id;
    const sellerId = req.user.id;

    try {
        const [listings] = await db.execute('SELECT * FROM listings WHERE id = ? AND seller_id = ?', [listingId, sellerId]);
        if (listings.length === 0) return res.status(404).json({ error: 'Listing not found' });

        const l = listings[0];
        const newId = crypto.randomUUID();

        // Duplicate listing entry
        await db.execute(
            `INSERT INTO listings (
                id, seller_id, title, description, price, programme, branch, semester, 
                subject_code, subject, material_type, is_draft, status, view_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, 'available', 0)`,
            [
                newId, sellerId, l.title, l.description, l.price, l.programme, l.branch, l.semester, 
                l.subject_code, l.subject, l.material_type
            ]
        );

        // Duplicate images
        const [imgs] = await db.execute('SELECT image_url, is_cover, order_index FROM listing_images WHERE listing_id = ?', [listingId]);
        for (const img of imgs) {
            await db.execute(
                'INSERT INTO listing_images (listing_id, image_url, is_cover, order_index) VALUES (?, ?, ?, ?)',
                [newId, img.image_url, img.is_cover, img.order_index]
            );
        }

        res.json({ success: true, id: newId, message: 'Listing relisted successfully' });
    } catch (error) {
        console.error('Relist failed:', error);
        res.status(500).json({ error: 'Failed to relist' });
    }
});

// GET /api/listings/analytics/views - 7-day view analytics
router.get('/analytics/views', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // This is a simplified demo-version analytics. 
        // Real logic would query a daily_stats or listing_views table.
        // Returning dummy historical data for the chart as requested.
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = days.map(d => ({ date: d, view_count: Math.floor(Math.random() * 50) + 10 }));
        
        res.json({ 
            data, 
            total_week: 145, 
            prev_week: 120, 
            total_inquiries: 12, 
            prev_inquiries: 8 
        });
    } catch (error) {
        res.status(500).json({ error: 'Analytics fetch failed' });
    }
});

// GET /api/listings/analytics/tip - AI Performance Tip
router.get('/analytics/tip', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT l.title, l.view_count, l.price, l.ai_score,
                (SELECT COUNT(*) FROM conversations WHERE listing_id = l.id) as inquiry_count,
                (SELECT COUNT(*) FROM listing_images WHERE listing_id = l.id) as image_count
            FROM listings l
            WHERE l.seller_id = ? AND l.status = 'available' AND l.is_draft = FALSE
            HAVING view_count > 0
            ORDER BY (inquiry_count / view_count) ASC
            LIMIT 1
        `;
        const [rows] = await db.execute(query, [userId]);
        
        if (rows.length === 0) return res.json({ data: null });

        const l = rows[0];
        const ratio = l.inquiry_count / l.view_count;
        let suggestion = "Consider adding more descriptive tags to help buyers find your notes.";

        if (ratio < 0.15 && l.view_count > 10) {
            if (l.image_count <= 1) {
                suggestion = "Add more photos to show the full content of your notes — buyers want to see what they are getting";
            } else if (l.ai_score < 7) {
                suggestion = "Your AI score is below 7 — try uploading a cleaner cover photo to improve it.";
            } else {
                suggestion = "Consider lowering your price — high views but low inquiries often means the price feels too high";
            }
        }

        res.json({ 
            data: {
                listing_title: l.title,
                view_count: l.view_count,
                inquiry_count: l.inquiry_count,
                conversion_rate: ratio,
                suggestion
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Tip calculation failed' });
    }
});

// DELETE /api/listings/:id - Permanently delete a listing
router.delete('/:id', authenticateToken, async (req, res) => {
    const listingId = req.params.id;
    const userId = req.user.id;

    try {
        // Verify ownership
        const [listings] = await db.execute('SELECT * FROM listings WHERE id = ? AND seller_id = ?', [listingId, userId]);
        if (listings.length === 0) {
            return res.status(404).json({ error: 'Listing not found or permission denied.' });
        }

        // Start transaction for clean cleanup
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Delete related records
            await connection.execute('DELETE FROM listing_images WHERE listing_id = ?', [listingId]);
            await connection.execute('DELETE FROM listing_tags WHERE listing_id = ?', [listingId]);
            await connection.execute('DELETE FROM bookmarks WHERE listing_id = ?', [listingId]);
            await connection.execute('DELETE FROM reviews WHERE listing_id = ?', [listingId]);
            
            // Note: conversations are kept for history but orphaned from listing
            await connection.execute('UPDATE conversations SET listing_id = NULL WHERE listing_id = ?', [listingId]);

            // Final: Delete the listing
            await connection.execute('DELETE FROM listings WHERE id = ?', [listingId]);

            await connection.commit();
            res.json({ success: true, message: 'Listing deleted successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete listing.' });
    }
});

// DELETE /api/listings/draft/:id - Remove a draft
router.delete('/draft/:id', authenticateToken, async (req, res) => {
    try {
        await db.execute('DELETE FROM listings WHERE id = ? AND seller_id = ? AND is_draft = TRUE', [req.params.id, req.user.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to discard draft' });
    }
});

// POST /api/listings/:id/rescore - Manually re-run AI scorer
router.post('/:id/rescore', authenticateToken, async (req, res) => {
    try {
        const listingId = req.params.id;
        
        // Fetch first image
        const [images] = await db.execute(
            'SELECT image_url FROM listing_images WHERE listing_id = ? ORDER BY order_index ASC LIMIT 1',
            [listingId]
        );

        if (images.length === 0) {
            return res.status(404).json({ error: 'No images found for this listing.' });
        }

        const result = await scoreNote(images[0].image_url);
        if (!result) {
            return res.status(500).json({ error: 'AI scoring failed.' });
        }

        await db.execute(
            'UPDATE listings SET ai_score = ?, ai_reasons = ? WHERE id = ?',
            [result.score, JSON.stringify(result.reasons), listingId]
        );

        res.json({ message: 'Scoring successful', score: result.score, reasons: result.reasons });
    } catch (error) {
        console.error('Rescore error:', error);
        res.status(500).json({ error: 'Failed to rescore listing.' });
    }
});

// DELETE /api/listings/me/drafts - Clear all drafts for the current user
router.delete('/me/drafts/all', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Get all draft IDs for this user
            const [drafts] = await connection.execute('SELECT id FROM listings WHERE seller_id = ? AND is_draft = TRUE', [userId]);
            const draftIds = drafts.map(d => d.id);

            if (draftIds.length > 0) {
                const placeholders = draftIds.map(() => '?').join(',');
                
                // 2. Delete related records for these drafts
                await connection.execute(`DELETE FROM listing_images WHERE listing_id IN (${placeholders})`, draftIds);
                await connection.execute(`DELETE FROM listing_tags WHERE listing_id IN (${placeholders})`, draftIds);
                
                // 3. Delete the listings themselves
                await connection.execute(`DELETE FROM listings WHERE seller_id = ? AND is_draft = TRUE`, [userId]);
            }

            await connection.commit();
            res.json({ success: true, message: 'All drafts cleared successfully' });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error clearing drafts:', error);
        res.status(500).json({ error: 'Failed to clear drafts' });
    }
});

module.exports = router;
