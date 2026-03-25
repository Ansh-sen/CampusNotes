const db = require('./db');

async function runMigration() {
    try {
        console.log('🚀 Starting Academic Normalization...');

        // 1. Create Tables
        await db.execute(`
            CREATE TABLE IF NOT EXISTS academic_programmes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created academic_programmes');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS academic_branches (
                id INT AUTO_INCREMENT PRIMARY KEY,
                programme_id INT NOT NULL,
                name VARCHAR(150) NOT NULL,
                code VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (programme_id) REFERENCES academic_programmes(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created academic_branches');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS academic_subjects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                branch_id INT NOT NULL,
                semester INT NOT NULL,
                subject_code VARCHAR(50) NOT NULL,
                subject_name VARCHAR(255) NOT NULL,
                credits INT DEFAULT 0,
                type VARCHAR(50) DEFAULT 'Core',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_id) REFERENCES academic_branches(id) ON DELETE CASCADE
            )
        `);
        console.log('✅ Created academic_subjects');

        // 2. Insert Data
        await db.execute(`
            INSERT IGNORE INTO academic_programmes (name, code)
            SELECT DISTINCT programme, programme FROM rgpv_subjects
        `);
        console.log('✅ Migrated programmes');

        await db.execute(`
            INSERT IGNORE INTO academic_branches (programme_id, name, code)
            SELECT DISTINCT p.id, r.branch, r.branch
            FROM rgpv_subjects r
            JOIN academic_programmes p ON r.programme = p.code
        `);
        console.log('✅ Migrated branches');

        await db.execute(`
            INSERT IGNORE INTO academic_subjects (branch_id, semester, subject_code, subject_name)
            SELECT DISTINCT b.id, r.semester, r.subject_code, r.subject_name
            FROM rgpv_subjects r
            JOIN academic_branches b ON r.branch = b.name
            JOIN academic_programmes p ON b.programme_id = p.id AND r.programme = p.code
        `);
        console.log('✅ Migrated subjects');

        console.log('🎉 Academic Normalization Completed Successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Normalization failed:', error);
        process.exit(1);
    }
}

runMigration();
