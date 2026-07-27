-- Phase 3: Performance Optimization - Database Indexes
-- Adding indexes to frequently filtered and joined columns

-- 1. Listings Table
ALTER TABLE listings 
ADD INDEX idx_listings_programme (programme),
ADD INDEX idx_listings_branch (branch),
ADD INDEX idx_listings_semester (semester),
ADD INDEX idx_listings_subject (subject),
ADD INDEX idx_listings_status_draft (status, is_draft);

-- 2. Profiles Table
ALTER TABLE profiles
ADD INDEX idx_profiles_programme (programme),
ADD INDEX idx_profiles_branch (branch),
ADD INDEX idx_profiles_semester (semester);

-- 3. Messages Table
-- conversation_id is already indexed (MUL), adding recipient_id for unread counts
ALTER TABLE messages
ADD INDEX idx_messages_recipient_is_read (recipient_id, is_read);

-- 4. Note Requests Table
ALTER TABLE note_requests
ADD INDEX idx_requests_subject (subject_code),
ADD INDEX idx_requests_branch_sem (branch, semester, programme);

-- 5. Exam Schedule Table (Frequently used in dashboard)
ALTER TABLE exam_schedule
ADD INDEX idx_exam_branch_sem (branch, semester, programme);
