-- Migration v10: Profile Overhaul (Refined)
ALTER TABLE profiles 
ADD COLUMN is_student_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN college_id_url TEXT,
ADD COLUMN referral_code VARCHAR(100),
ADD COLUMN notification_prefs JSON;

-- Set default JSON if needed
UPDATE profiles SET notification_prefs = '{"messages": true, "reviews": true, "exams": true}' WHERE notification_prefs IS NULL;
