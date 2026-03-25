const db = require('../db');
const fs = require('fs');

async function checkTables() {
    try {
        const [rows] = await db.execute('SHOW TABLES');
        let output = 'Tables in database: ' + JSON.stringify(rows.map(row => Object.values(row)[0])) + '\n';
        
        for (const row of rows) {
            const tableName = Object.values(row)[0];
            const [columns] = await db.execute(`DESCRIBE ${tableName}`);
            output += `\n--- ${tableName} ---\n`;
            columns.forEach(col => {
                output += `${col.Field}: ${col.Type} | Null: ${col.Null} | Key: ${col.Key}\n`;
            });
        }
        fs.writeFileSync('tables_info.txt', output);
        console.log('Tables info written to tables_info.txt');
        process.exit(0);
    } catch (error) {
        console.error('Error checking tables:', error);
        process.exit(1);
    }
}

checkTables();
