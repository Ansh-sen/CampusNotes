const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, 'migrations', 'admin_setup.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        
        // Split SQL by semicolon, filtering out empty lines and handling comments
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`🚀 Starting migration with ${statements.length} statements...`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`Executing statement ${i + 1}/${statements.length}...`);
            await db.execute(statement);
        }

        console.log('✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
