-- Add payment status to purchases table
ALTER TABLE purchases 
ADD COLUMN payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
ADD COLUMN payment_id VARCHAR(255) NULL;

-- Add earnings tracking to profiles table
ALTER TABLE profiles 
ADD COLUMN earnings_total DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN notes_sold INT DEFAULT 0;
