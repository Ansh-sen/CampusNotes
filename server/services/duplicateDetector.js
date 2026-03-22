const sharp = require('sharp');
const db = require('../db');
const path = require('path');
const fs = require('fs');

/**
 * Checks for duplicate listings based on perceptual hash of the first image.
 */
async function checkDuplicate(imageStreamOrPath) {
  try {
    // Generate perceptual hash (8x8 grayscale)
    const buffer = await sharp(imageStreamOrPath)
      .grayscale()
      .resize(8, 8, { fit: 'fill' })
      .raw()
      .toBuffer();

    const hash = buffer.toString('hex');

    // Fetch all existing hashes
    const [existing] = await db.execute('SELECT ih.listing_id, ih.image_hash, l.title, p.full_name as seller_name FROM image_hashes ih JOIN listings l ON ih.listing_id = l.id JOIN profiles p ON l.seller_id = p.id');

    for (const item of existing) {
      const similarity = calculateSimilarity(hash, item.image_hash);
      if (similarity >= 0.85) {
        return {
          is_duplicate: true,
          title: item.title,
          seller: item.seller_name
        };
      }
    }

    return { is_duplicate: false };
  } catch (error) {
    console.error('Duplicate Detector Error:', error);
    return { is_duplicate: false };
  }
}

function calculateSimilarity(hash1, hash2) {
  if (hash1 === hash2) return 1.0;
  
  // Hamming distance on hex strings
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  // Max distance is 128 (64 chars * 2 hex digits? No, 8x8 is 64 pixels, each pixel is 1 byte -> 128 hex chars if it's 8x8 buffer)
  // Actually buffer.toString('hex') for 64 bytes is 128 chars.
  const maxLength = hash1.length;
  return 1 - (distance / maxLength);
}

module.exports = { checkDuplicate };
