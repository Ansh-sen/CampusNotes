const db = require('./server/db');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function migrate() {
  try {
    console.log('--- Creating image_hashes table ---');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS image_hashes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        listing_id VARCHAR(255) NOT NULL,
        image_hash VARCHAR(128) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX (listing_id),
        INDEX (image_hash)
      )
    `);

    console.log('--- Fetching existing listings without hashes ---');
    const [listings] = await db.execute('SELECT l.id, li.image_url FROM listings l JOIN listing_images li ON l.id = li.listing_id LEFT JOIN image_hashes ih ON l.id = ih.listing_id WHERE li.is_cover = TRUE AND ih.id IS NULL');

    console.log(`Found ${listings.length} listings to process.`);

    for (const listing of listings) {
      // listing.image_url is like '/uploads/1742410313337.jpg'
      // We need absolute path: d:\models\campus-notes\server\uploads\...
      const relativePath = listing.image_url.startsWith('/') ? listing.image_url.slice(1) : listing.image_url;
      const imagePath = path.join(__dirname, 'server', relativePath);
      
      if (!fs.existsSync(imagePath)) {
        console.warn(`Image not found: ${imagePath}`);
        continue;
      }

      try {
        // Generate perceptual hash (simple 8x8 grayscale)
        const buffer = await sharp(imagePath)
          .grayscale()
          .resize(8, 8, { fit: 'fill' })
          .raw()
          .toBuffer();

        const hash = buffer.toString('hex');
        
        await db.execute(
          'INSERT INTO image_hashes (listing_id, image_hash) VALUES (?, ?)',
          [listing.id, hash]
        );
        console.log(`Processed listing: ${listing.id}`);
      } catch (sharpErr) {
        console.error(`Error processing image ${imagePath}:`, sharpErr.message);
      }
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();
