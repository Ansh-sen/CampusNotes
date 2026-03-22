-- Migration V4: Digital File Support
ALTER TABLE listings
ADD COLUMN file_url VARCHAR(255) DEFAULT NULL;
