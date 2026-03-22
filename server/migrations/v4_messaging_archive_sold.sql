-- Migration V4: Messaging Archive & Transaction tracking
ALTER TABLE conversations ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE listings ADD COLUMN buyer_id VARCHAR(255) DEFAULT NULL;
