const db = require('./db');

async function reassign() {
    try {
        const sellerId = 'ef162798-277b-4768-923a-87a96c001dd1'; // Ansh
        const mohitId = '8c1de1d7-d414-4b7a-a894-be6d6b508758';   // Mohit
        
        // Update 5 available listings from Ansh to Mohit
        const [update] = await db.execute(
            'UPDATE listings SET seller_id = ? WHERE seller_id = ? AND status = "available" AND is_draft = FALSE LIMIT 5',
            [mohitId, sellerId]
        );
        
        console.log(`Successfully reassigned ${update.affectedRows} listings to Mohit.`);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

reassign();
