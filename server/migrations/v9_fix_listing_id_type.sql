-- Migration V9: Fix Listing ID Type Mismatch
-- Changing listing_id from INT to VARCHAR(36) to match listings.id (UUID)

-- 1. Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Modify listing_images
ALTER TABLE listing_images MODIFY COLUMN listing_id VARCHAR(36) NOT NULL;

-- 3. Modify listing_tags
ALTER TABLE listing_tags MODIFY COLUMN listing_id VARCHAR(36) NOT NULL;

-- 4. Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
