const mysql = require('mysql2/promise');
const config = {host: 'localhost', user: 'root', password: '', database: 'campus_notes'};
async function run() {
    try {
        const db = await mysql.createConnection(config);
        const queries = [
            'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_sales INT DEFAULT 0',
            'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT "unverified"',
            'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_student_verified BOOLEAN DEFAULT FALSE',
            'ALTER TABLE profiles CHANGE COLUMN IF EXISTS id_image_urlal id_image_url VARCHAR(500)'
        ];
        
        // Manual check for id_image_urlal if IF EXISTS is not supported
        const [columns] = await db.execute('DESCRIBE profiles');
        const columnNames = columns.map(c => c.Field);
        
        if (!columnNames.includes('total_sales')) await db.execute('ALTER TABLE profiles ADD COLUMN total_sales INT DEFAULT 0');
        if (!columnNames.includes('verification_status')) await db.execute('ALTER TABLE profiles ADD COLUMN verification_status VARCHAR(50) DEFAULT "unverified"');
        if (!columnNames.includes('is_student_verified')) await db.execute('ALTER TABLE profiles ADD COLUMN is_student_verified BOOLEAN DEFAULT FALSE');
        if (columnNames.includes('id_image_urlal')) await db.execute('ALTER TABLE profiles CHANGE id_image_urlal id_image_url VARCHAR(500)');

        console.log('Profiles table schema fixed successfully');
        process.exit(0);
    } catch (e) {
        console.error('Schema fix failed:', e);
        process.exit(1);
    }
}
run();
