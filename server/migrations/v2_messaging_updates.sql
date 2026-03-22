-- Migration V2: Update messaging system fields

-- Update messages table
ALTER TABLE messages 
ADD COLUMN message_type ENUM('text', 'image', 'file') DEFAULT 'text',
ADD COLUMN attachment_url VARCHAR(255) DEFAULT NULL,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
ADD COLUMN is_read BOOLEAN DEFAULT FALSE,
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;

-- Optional: If you want to migrate existing file data (if any)
-- UPDATE messages SET message_type = 'file', attachment_url = file_url WHERE file_url IS NOT NULL;

-- Update conversations table to track unread counts and mute status
ALTER TABLE conversations
ADD COLUMN unread_count INT DEFAULT 0,
ADD COLUMN is_muted BOOLEAN DEFAULT FALSE;
