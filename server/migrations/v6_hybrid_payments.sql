-- Expand purchase_status and add hybrid payment fields
ALTER TABLE purchases 
MODIFY COLUMN payment_status ENUM('pending', 'paid_online', 'verification_pending', 'approved', 'rejected', 'cash_verified') DEFAULT 'pending';

-- Rename column for better clarity if needed, but the user requested purchase_status. 
-- Let's stick to the user's naming preference.
ALTER TABLE purchases 
CHANGE COLUMN payment_status purchase_status ENUM('pending', 'paid_online', 'verification_pending', 'approved', 'rejected', 'cash_verified') DEFAULT 'pending';

ALTER TABLE purchases 
ADD COLUMN payment_method ENUM('online', 'upi', 'cash') DEFAULT 'online',
ADD COLUMN payment_screenshot VARCHAR(255) NULL,
ADD COLUMN otp_code VARCHAR(10) NULL,
ADD COLUMN otp_expiry DATETIME NULL;
