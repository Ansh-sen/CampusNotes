/**
 * Lightweight Validation Middleware for CampusNotes
 * Focused on sanitizing and validating common input patterns.
 */

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
    // At least 6 characters
    return typeof password === 'string' && password.length >= 6;
};

const sanitizeString = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim();
};

const validateRegistration = (req, res, next) => {
    const { email, password, full_name } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!password || !validatePassword(password)) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    if (!full_name || sanitizeString(full_name).length < 2) {
        return res.status(400).json({ error: 'Please provide a valid full name.' });
    }

    req.body.email = email.toLowerCase().trim();
    req.body.full_name = sanitizeString(full_name);
    
    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !validateEmail(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (!password) {
        return res.status(400).json({ error: 'Password is required.' });
    }

    req.body.email = email.toLowerCase().trim();
    
    next();
};

const validateListing = (req, res, next) => {
    const { title, price, subject_code } = req.body;

    if (!title || sanitizeString(title).length < 3) {
        return res.status(400).json({ error: 'Title must be at least 3 characters long.' });
    }

    if (price === undefined || isNaN(price) || Number(price) < 0) {
        return res.status(400).json({ error: 'Please provide a valid non-negative price.' });
    }

    if (subject_code) {
        req.body.subject_code = sanitizeString(subject_code).toUpperCase();
    }

    req.body.title = sanitizeString(title);
    
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    validateListing
};
