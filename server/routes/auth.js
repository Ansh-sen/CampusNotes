const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here_change_in_production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Also check query parameter for file downloads
    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
        req.user = user; // user payload from token
        next();
    });
};

// POST: Register a new user
router.post('/register', async (req, res) => {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Check if user already exists
        const [existingUsers] = await db.execute('SELECT * FROM profiles WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const userId = uuidv4();

        // Insert into database
        await db.execute(
            'INSERT INTO profiles (id, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
            [userId, email, passwordHash, full_name || null]
        );

        // Generate JWT
        const token = jwt.sign({ id: userId, email: email }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({ 
            message: 'User registered successfully', 
            token,
            user: { id: userId, email, full_name }
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal server error during registration.' });
    }
});

// POST: Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    try {
        // Find user by email
        const [users] = await db.execute('SELECT * FROM profiles WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const user = users[0];

        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        // Generate JWT
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        // Don't send the password hash back
        delete user.password_hash;

        res.json({
            message: 'Logged in successfully',
            token,
            user
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error during login.' });
    }
});

// GET: Current Authenticated User Profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute('SELECT * FROM profiles WHERE id = ?', [req.user.id]);
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const user = users[0];
        delete user.password_hash; // Hide sensitive data

        // Fetch real stats
        const [[activeListings]] = await db.execute("SELECT COUNT(*) as count FROM listings WHERE seller_id = ? AND status = 'available' AND is_draft = FALSE", [user.id]);
        const [[soldListings]] = await db.execute("SELECT COUNT(*) as count FROM listings WHERE seller_id = ? AND status = 'sold'", [user.id]);
        const [[totalListings]] = await db.execute("SELECT COUNT(*) as count FROM listings WHERE seller_id = ? AND is_draft = FALSE", [user.id]);
        const [[reviews]] = await db.execute("SELECT COUNT(*) as count FROM reviews WHERE reviewee_id = ?", [user.id]);

        res.json({ 
            user,
            stats: {
                active: activeListings.count,
                sold: soldListings.count,
                reviews: reviews.count,
                total: totalListings.count,
                earned: user.earnings_total || 0,
                rating: user.rating_avg || 0
            }
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Error fetching user profile.' });
    }
});

// PUT: Update Profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { 
            bio, avatar_url, full_name, branch, semester, programme,
            is_student_verified, college_id_url, referral_code, notification_prefs 
        } = req.body;
        
        // Fetch current profile to handle partial updates safely
        const [profiles] = await db.execute('SELECT * FROM profiles WHERE id = ?', [req.user.id]);
        if (profiles.length === 0) return res.status(404).json({ error: 'Profile not found' });
        
        const current = profiles[0];
        const newBio = bio !== undefined ? bio : current.bio;
        const newAvatar = avatar_url !== undefined ? avatar_url : current.avatar_url;
        const newFullName = full_name !== undefined ? full_name : current.full_name;
        const newBranch = branch !== undefined ? branch : current.branch;
        const newSemester = semester !== undefined ? semester : current.semester;
        const newProgramme = programme !== undefined ? programme : current.programme;
        const newIsVerified = is_student_verified !== undefined ? is_student_verified : current.is_student_verified;
        const newCollegeIdUrl = college_id_url !== undefined ? college_id_url : current.college_id_url;
        const newReferralCode = referral_code !== undefined ? referral_code : current.referral_code;
        const newNotificationPrefs = notification_prefs !== undefined ? 
            (typeof notification_prefs === 'object' ? JSON.stringify(notification_prefs) : notification_prefs) 
            : current.notification_prefs;
        
        await db.execute(
            `UPDATE profiles SET 
                bio = ?, avatar_url = ?, full_name = ?, branch = ?, 
                semester = ?, programme = ?, is_student_verified = ?, 
                college_id_url = ?, referral_code = ?, notification_prefs = ? 
             WHERE id = ?`,
            [
                newBio, newAvatar, newFullName, newBranch, 
                newSemester, newProgramme, newIsVerified, 
                newCollegeIdUrl, newReferralCode, newNotificationPrefs, 
                req.user.id
            ]
        );

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Error updating user profile.' });
    }
});

// POST: Request Password Reset
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        const [users] = await db.execute('SELECT id FROM profiles WHERE email = ?', [email]);
        if (users.length === 0) {
            // Security best practice: don't reveal if email doesn't exist
            return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 3600000); // 1 hour

        await db.execute(
            'UPDATE profiles SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
            [resetToken, expiry, email]
        );

        // Mock Email: In a real app, send a real email here.
        console.log('--- PASSWORD RESET SYSTEM ---');
        console.log(`Reset link for ${email}: http://localhost:5173/reset-password?token=${resetToken}`);
        console.log('-----------------------------');

        res.json({ message: 'If an account exists with that email, a reset link has been sent.' });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// POST: Reset Password
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token and new password are required.' });
    }

    try {
        const [users] = await db.execute(
            'SELECT id FROM profiles WHERE reset_token = ? AND reset_token_expiry > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token.' });
        }

        const userId = users[0].id;

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update password and clear token
        await db.execute(
            'UPDATE profiles SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [passwordHash, userId]
        );

        res.json({ message: 'Password updated successfully! You can now log in.' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        res.status(500).json({ error: 'Failed to reset password.' });
    }
});

module.exports = { router, authenticateToken };
