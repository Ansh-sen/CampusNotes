-- Create RGPV Subjects Table
CREATE TABLE IF NOT EXISTS rgpv_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    programme VARCHAR(100) NOT NULL,
    branch VARCHAR(150) NOT NULL,
    semester INT NOT NULL,
    subject_code VARCHAR(50) NOT NULL,
    subject_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_programme (programme),
    INDEX idx_programme_branch (programme, branch),
    INDEX idx_programme_branch_semester (programme, branch, semester),
    INDEX idx_subject_code (subject_code)
);

-- Add RGPV columns to listings table (run if not exists)
ALTER TABLE listings
    ADD COLUMN IF NOT EXISTS programme VARCHAR(100) DEFAULT NULL AFTER subject,
    ADD COLUMN IF NOT EXISTS subject_code VARCHAR(50) DEFAULT NULL AFTER programme;

-- Add index on subject_code for fast lookups
ALTER TABLE listings 
    ADD INDEX IF NOT EXISTS idx_subject_code (subject_code);
