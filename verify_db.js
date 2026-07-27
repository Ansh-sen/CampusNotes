const db = require('./server/db');

async function verifyColumn() {
    try {
        const [rows] = await db.execute("DESCRIBE profiles id_image_url");
        console.log("Column Details:", JSON.stringify(rows[0], null, 2));
        if (rows[0].Type.includes('longtext')) {
            console.log("✅ Verification Success: id_image_url is LONGTEXT.");
        } else {
            console.log("❌ Verification Failed: id_image_url is", rows[0].Type);
        }
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to verify column:", error.message);
        process.exit(1);
    }
}

verifyColumn();
