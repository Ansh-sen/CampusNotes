const db = require('./db');

async function update() {
    try {
        const mohitId = '8c1de1d7-d414-4b7a-a894-be6d6b508758';
        
        await db.execute(
            'UPDATE listings SET branch = "AIML", semester = 6, programme = "B.tech" WHERE seller_id = ? AND status = "available"',
            [mohitId]
        );
        
        console.log('Successfully updated metadata for Mohit\'s listings.');

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

update();
