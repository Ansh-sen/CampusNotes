-- Migration V3: Listing Improvements
-- Add new fields to listings table
ALTER TABLE listings
ADD COLUMN branch VARCHAR(100) DEFAULT NULL,
ADD COLUMN year VARCHAR(50) DEFAULT NULL,
ADD COLUMN semester VARCHAR(50) DEFAULT NULL,
ADD COLUMN material_type VARCHAR(100) DEFAULT NULL,
ADD COLUMN item_condition VARCHAR(50) DEFAULT NULL,
ADD COLUMN is_draft BOOLEAN DEFAULT FALSE;

-- Create listing_images table for multi-image support
CREATE TABLE IF NOT EXISTS listing_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_cover BOOLEAN DEFAULT FALSE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- Create listing_tags table
CREATE TABLE IF NOT EXISTS listing_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    tag_name VARCHAR(50) NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- Note: We keep the old 'images' column in 'listings' for backward compatibility 
-- but will phase it out in favor of listing_images table.
