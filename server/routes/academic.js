const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('./auth');

/**
 * GET /api/programmes
 * Returns all unique programmes
 */
router.get('/programmes', async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT DISTINCT programme FROM rgpv_subjects ORDER BY programme ASC'
        );
        res.json({ data: rows.map(r => r.programme) });
    } catch (error) {
        console.error('Error fetching programmes:', error);
        res.status(500).json({ error: 'Failed to fetch programmes.' });
    }
});

/**
 * GET /api/branches?programme=B.E.
 * Returns unique branches for a given programme
 */
router.get('/branches', async (req, res) => {
    const { programme } = req.query;
    if (!programme) {
        return res.status(400).json({ error: 'programme query param is required.' });
    }
    try {
        const [rows] = await db.execute(
            'SELECT DISTINCT branch FROM rgpv_subjects WHERE programme = ? ORDER BY branch ASC',
            [programme]
        );
        res.json({ data: rows.map(r => r.branch) });
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({ error: 'Failed to fetch branches.' });
    }
});

/**
 * GET /api/semesters?programme=B.E.&branch=Computer Science & Engineering
 * Returns unique semesters for a given programme + branch
 */
router.get('/semesters', async (req, res) => {
    const { programme, branch } = req.query;
    if (!programme || !branch) {
        return res.status(400).json({ error: 'programme and branch query params are required.' });
    }
    try {
        const [rows] = await db.execute(
            'SELECT DISTINCT semester FROM rgpv_subjects WHERE programme = ? AND branch = ? ORDER BY semester ASC',
            [programme, branch]
        );
        res.json({ data: rows.map(r => r.semester) });
    } catch (error) {
        console.error('Error fetching semesters:', error);
        res.status(500).json({ error: 'Failed to fetch semesters.' });
    }
});

/**
 * GET /api/subjects?programme=B.E.&branch=Computer Science & Engineering&semester=3
 * Returns subjects (code + name) for given programme + branch + semester
 */
router.get('/subjects', async (req, res) => {
    const { programme, branch, semester } = req.query;
    if (!programme || !branch || !semester) {
        return res.status(400).json({ error: 'programme, branch, and semester query params are required.' });
    }
    try {
        const [rows] = await db.execute(
            `SELECT subject_code, subject_name 
             FROM rgpv_subjects 
             WHERE programme = ? AND branch = ? AND semester = ? 
             ORDER BY subject_code ASC`,
            [programme, branch, parseInt(semester, 10)]
        );
        res.json({ data: rows });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ error: 'Failed to fetch subjects.' });
    }
});

/**
 * GET /api/categories
 * Returns unique material types from listings table
 */
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT DISTINCT material_type 
             FROM listings 
             WHERE status = 'available' AND is_draft = FALSE AND material_type IS NOT NULL`
        );
        const categories = rows.map((r, idx) => ({
            id: r.material_type.toLowerCase().replace(/\s+/g, '-'),
            label: r.material_type
        }));
        res.json({ data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories.' });
    }
});

/**
 * GET /api/exams/upcoming
 * Returns the nearest upcoming exam for a student
 */
router.get('/exams/upcoming', async (req, res) => {
    const { programme, branch, semester } = req.query;
    if (!programme || !branch || !semester) {
        return res.status(400).json({ error: 'programme, branch, and semester are required.' });
    }
    try {
        const query = `
            SELECT subject_name, subject_code, exam_date, 
            DATEDIFF(exam_date, CURDATE()) as days_remaining 
            FROM exam_schedule 
            WHERE branch = ? AND semester = ? AND programme = ? AND exam_date >= CURDATE() 
            ORDER BY exam_date ASC 
            LIMIT 1
        `;
        const [rows] = await db.execute(query, [branch, parseInt(semester, 10), programme]);
        
        if (rows.length === 0) {
            return res.json({ data: null });
        }
        
        res.json({ data: rows[0] });
    } catch (error) {
        console.error('Error fetching upcoming exam:', error);
        res.status(500).json({ error: 'Failed to fetch upcoming exam.' });
    }
});

/**
 * GET /api/study-gap
 * Compares syllabus topics with user purchases
 */
router.get('/study-gap', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { programme, branch, semester } = req.query;
        
        if (!programme || !branch || !semester) {
            return res.status(400).json({ error: 'programme, branch, and semester are required.' });
        }

        // 1. Fetch all syllabus topics
        const [allTopics] = await db.execute(
            'SELECT subject_code, topic_name FROM syllabus_topics WHERE branch = ? AND semester = ? AND programme = ?',
            [branch, parseInt(semester, 10), programme]
        );

        if (allTopics.length === 0) {
            return res.json({ coverage_percent: 0, covered: [], missing: [] });
        }

        // 2. Fetch purchased subject codes
        const [purchasedRecords] = await db.execute(
            `SELECT DISTINCT l.subject_code 
             FROM purchases p 
             JOIN listings l ON p.listing_id = l.id 
             WHERE p.buyer_id = ? AND l.subject_code IS NOT NULL`,
            [userId]
        );
        const purchasedCodes = new Set(purchasedRecords.map(r => r.subject_code));

        // 3. Process topics
        const covered = [];
        const missing = [];

        for (const topic of allTopics) {
            if (purchasedCodes.has(topic.subject_code)) {
                covered.push(topic);
            } else {
                missing.push(topic);
            }
        }

        const coverage_percent = Math.round((covered.length / allTopics.length) * 100);

        // Limit to 6 items total as requested
        const totalLimit = 6;
        const resultCovered = covered.slice(0, totalLimit);
        const resultMissing = missing.slice(0, totalLimit - resultCovered.length);

        res.json({
            coverage_percent,
            covered: resultCovered,
            missing: resultMissing
        });
    } catch (error) {
        console.error('Error calculating study gap:', error);
        res.status(500).json({ error: 'Failed to calculate study gap.' });
    }
});

module.exports = router;
