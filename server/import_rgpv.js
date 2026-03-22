/**
 * RGPV Subjects CSV Importer
 * Run once: node server/import_rgpv.js
 * 
 * Requires: npm install csv-parse (run inside /server)
 * CSV location: server/rgpv_subjects.csv
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const db = require('./db');

const CSV_PATH = path.join(__dirname, 'rgpv_subjects.csv');

async function createTableIfNotExists() {
    await db.execute(`
        CREATE TABLE IF NOT EXISTS rgpv_subjects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            programme VARCHAR(50) NOT NULL,
            branch VARCHAR(100) NOT NULL,
            semester TINYINT UNSIGNED NOT NULL,
            subject_code VARCHAR(30) NOT NULL,
            subject_name VARCHAR(200) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_programme (programme),
            INDEX idx_prog_branch (programme, branch(100)),
            INDEX idx_prog_br_sem (programme, branch(80), semester),
            INDEX idx_subject_code (subject_code)
        )
    `);
    console.log('✅ Table rgpv_subjects ready.');
}

async function addListingColumns() {
    try {
        // Check if columns already exist
        const [cols] = await db.execute(`SHOW COLUMNS FROM listings LIKE 'programme'`);
        if (cols.length === 0) {
            await db.execute(`ALTER TABLE listings ADD COLUMN programme VARCHAR(100) DEFAULT NULL`);
            console.log('✅ Added column: listings.programme');
        } else {
            console.log('ℹ️  Column listings.programme already exists.');
        }

        const [cols2] = await db.execute(`SHOW COLUMNS FROM listings LIKE 'subject_code'`);
        if (cols2.length === 0) {
            await db.execute(`ALTER TABLE listings ADD COLUMN subject_code VARCHAR(50) DEFAULT NULL`);
            await db.execute(`ALTER TABLE listings ADD INDEX idx_subject_code (subject_code)`);
            console.log('✅ Added column: listings.subject_code');
        } else {
            console.log('ℹ️  Column listings.subject_code already exists.');
        }
    } catch (err) {
        console.error('❌ Error adding listing columns:', err.message);
    }
}

async function importCSV() {
    if (!fs.existsSync(CSV_PATH)) {
        console.error(`❌ CSV file not found at: ${CSV_PATH}`);
        process.exit(1);
    }

    // Clear existing data
    await db.execute('DELETE FROM rgpv_subjects');
    console.log('🗑️  Cleared existing rgpv_subjects data.');

    return new Promise((resolve, reject) => {
        const rows = [];
        
        fs.createReadStream(CSV_PATH)
            .pipe(parse({ columns: true, trim: true, skip_empty_lines: true }))
            .on('data', (row) => {
                rows.push([
                    row.programme,
                    row.branch,
                    parseInt(row.semester, 10),
                    row.subject_code,
                    row.subject_name
                ]);
            })
            .on('end', async () => {
                console.log(`📋 Parsed ${rows.length} rows from CSV.`);
                
                let inserted = 0;
                for (const row of rows) {
                    try {
                        await db.execute(
                            'INSERT INTO rgpv_subjects (programme, branch, semester, subject_code, subject_name) VALUES (?, ?, ?, ?, ?)',
                            row
                        );
                        inserted++;
                    } catch (err) {
                        console.warn(`⚠️  Skipping row [${row[3]}]: ${err.message}`);
                    }
                }
                
                console.log(`✅ Imported ${inserted}/${rows.length} subjects successfully!`);
                resolve();
            })
            .on('error', reject);
    });
}

async function main() {
    console.log('🚀 Starting RGPV subjects import...\n');
    try {
        await createTableIfNotExists();
        await addListingColumns();
        await importCSV();
        console.log('\n✅ Import complete! RGPV academic data is ready.');
    } catch (err) {
        console.error('❌ Import failed:', err);
    } finally {
        process.exit(0);
    }
}

main();
