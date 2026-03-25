const db = require('./db');

async function fix() {
    try {
        console.log('Starting DB fix...');
        
        // 1. Listings Table
        try {
            await db.execute("ALTER TABLE listings ADD COLUMN approval_status ENUM('pending_approval', 'approved', 'rejected') DEFAULT 'pending_approval' AFTER file_url");
            console.log('Added approval_status to listings');
        } catch (e) { console.log('approval_status might already exist or error:', e.message); }

        try {
            await db.execute("ALTER TABLE listings ADD COLUMN rejection_reason TEXT AFTER approval_status");
            console.log('Added rejection_reason to listings');
        } catch (e) { console.log('rejection_reason error:', e.message); }

        try {
            await db.execute("ALTER TABLE listings ADD COLUMN approved_at TIMESTAMP NULL AFTER rejection_reason");
            console.log('Added approved_at to listings');
        } catch (e) { console.log('approved_at error:', e.message); }

        try {
            await db.execute("ALTER TABLE listings ADD COLUMN approved_by VARCHAR(36) AFTER approved_at");
            console.log('Added approved_by to listings');
        } catch (e) { console.log('approved_by error:', e.message); }

        // 2. Profiles Table
        try {
            await db.execute("ALTER TABLE profiles ADD COLUMN verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' AFTER is_student_verified");
            console.log('Added verification_status to profiles');
        } catch (e) { console.log('verification_status error:', e.message); }

        try {
            await db.execute("ALTER TABLE profiles ADD COLUMN enrollment_number VARCHAR(50) AFTER verification_status");
            console.log('Added enrollment_number to profiles');
        } catch (e) { console.log('enrollment_number error:', e.message); }

        try {
            await db.execute("ALTER TABLE profiles ADD COLUMN verified_at TIMESTAMP NULL AFTER enrollment_number");
            console.log('Added verified_at to profiles');
        } catch (e) { console.log('verified_at error:', e.message); }

        try {
            await db.execute("ALTER TABLE profiles ADD COLUMN verification_rejected_reason TEXT AFTER verified_at");
            console.log('Added verification_rejected_reason to profiles');
        } catch (e) { console.log('verification_rejected_reason error:', e.message); }

        try {
            await db.execute("ALTER TABLE profiles ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE AFTER verification_rejected_reason");
            console.log('Added is_blocked to profiles');
        } catch (e) { console.log('is_blocked error:', e.message); }

        // 3. New Tables (ensure they exist)
        const tables = [
            `CREATE TABLE IF NOT EXISTS admin_users (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('superadmin', 'moderator') DEFAULT 'moderator',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS academic_programmes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(20) UNIQUE NOT NULL
            )`,
            `CREATE TABLE IF NOT EXISTS academic_branches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                programme_id INT,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(20) NOT NULL,
                FOREIGN KEY (programme_id) REFERENCES academic_programmes(id),
                UNIQUE KEY unique_branch (programme_id, code)
            )`,
            `CREATE TABLE IF NOT EXISTS academic_subjects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                branch_id INT,
                semester INT NOT NULL,
                subject_name VARCHAR(255) NOT NULL,
                subject_code VARCHAR(20) NOT NULL,
                FOREIGN KEY (branch_id) REFERENCES academic_branches(id),
                UNIQUE KEY unique_subject (branch_id, semester, subject_code)
            )`
        ];

        for (const sql of tables) {
            await db.execute(sql);
        }
        console.log('Verified/Created Admin/Academic tables');

        // Insert initial admin if not exists
        const [admins] = await db.execute('SELECT id FROM admin_users WHERE email = "admin@campusnotes.com"');
        if (admins.length === 0) {
            // Using password 'admin123' hashed with bcrypt (standard rounds)
            const hash = '$2b$10$EpjXWzO3sUAnVv5.EaG2guG.XN.v1pL9QW7Xo/4S2E6sJXP8Jp6Zy'; 
            await db.execute(
                'INSERT INTO admin_users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
                [require('crypto').randomUUID(), 'System Admin', 'admin@campusnotes.com', hash, 'superadmin']
            );
            console.log('Inserted default admin');
        }

        console.log('DB Fix completed successfully');
    } catch (err) {
        console.error('DB Fix failed:', err.message);
    } finally {
        process.exit();
    }
}

fix();
