-- Migration V8: Add Academic Fields to Profiles
ALTER TABLE profiles
ADD COLUMN branch VARCHAR(100) DEFAULT NULL,
ADD COLUMN semester INT DEFAULT NULL,
ADD COLUMN programme VARCHAR(100) DEFAULT NULL;
