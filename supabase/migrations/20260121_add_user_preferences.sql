-- ============================================
-- User Preferences Migration
-- Run this SQL in Supabase Studio SQL Editor
-- ============================================

-- Add email_frequency column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_frequency VARCHAR(20) DEFAULT 'daily';

-- Add constraint for email_frequency
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_frequency_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_email_frequency_check 
        CHECK (email_frequency IN ('daily', 'three_per_week', 'weekly', 'off'));
    END IF;
END $$;

-- Add email_time column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_time VARCHAR(10) DEFAULT '07:00';

-- Add constraint for email_time
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_time_check'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT users_email_time_check 
        CHECK (email_time IN ('07:00', '12:00', '20:00'));
    END IF;
END $$;

-- Add interested_categories column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS interested_categories TEXT[] DEFAULT ARRAY['saas', 'ecommerce', 'app', 'content'];

-- Verify the migration
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('email_frequency', 'email_time', 'interested_categories');
