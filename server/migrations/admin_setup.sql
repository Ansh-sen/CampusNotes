-- Part 1: Database migrations for Admin Panel
-- Run these migrations to set up the admin system

-- Add columns to the existing profiles table (referenced as 'users' in the prompt)
ALTER TABLE profiles
  ADD COLUMN verification_status ENUM('unverified','pending','verified','rejected') NOT NULL DEFAULT 'unverified',
  ADD COLUMN enrollment_number VARCHAR(20) NULL,
  ADD COLUMN id_image_url VARCHAR(500) NULL,
  ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN verified_at DATETIME NULL,
  ADD COLUMN verification_rejected_reason TEXT NULL;

-- Add columns to the existing listings table
ALTER TABLE listings
  ADD COLUMN approval_status ENUM('pending_approval','approved','rejected','removed') NOT NULL DEFAULT 'pending_approval',
  ADD COLUMN rejection_reason TEXT NULL,
  ADD COLUMN approved_at DATETIME NULL,
  ADD COLUMN approved_by INT NULL;

-- Create these new tables
CREATE TABLE admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT NOW()
);

CREATE TABLE admin_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL REFERENCES admin_users(id),
  token VARCHAR(500) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT NOW()
);

CREATE TABLE verification_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(36) NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('approved','rejected') NOT NULL,
  reason TEXT NULL,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES profiles(id),
  FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

CREATE TABLE listing_approval_log (
  id INT PRIMARY KEY AUTO_INCREMENT,
  listing_id VARCHAR(36) NOT NULL,
  admin_id INT NOT NULL,
  action ENUM('approved','rejected','removed') NOT NULL,
  reason TEXT NULL,
  created_at DATETIME DEFAULT NOW(),
  FOREIGN KEY (listing_id) REFERENCES listings(id),
  FOREIGN KEY (admin_id) REFERENCES admin_users(id)
);

-- Insert the first admin account manually (Password: admin123)
INSERT INTO admin_users (name, email, password_hash)
VALUES ('Admin', 'admin@campusnotes.app', '$2b$10$qA38ZmNyZzC24iQ3chu38ukc2u4TwOR1SOtLkfcYFh');

-- Update all existing listings that were already approved/active before this migration
UPDATE listings SET approval_status = 'approved' WHERE status = 'available' OR status = 'sold';

-- Update all existing users to verified so existing students are not locked out
UPDATE profiles SET verification_status = 'verified', verified_at = NOW();
