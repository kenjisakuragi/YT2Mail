-- ============================================
-- Multi-Channel Support Migration
-- Run this SQL in Supabase Studio SQL Editor
-- ============================================

-- Create youtube_channels table
CREATE TABLE IF NOT EXISTS youtube_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id VARCHAR(255) UNIQUE NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    channel_url TEXT NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'business', 'side_hustle', 'saas', 'ecommerce', etc.
    subscriber_count INTEGER,
    is_active BOOLEAN DEFAULT true,
    last_checked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add channel_id to videos table
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES youtube_channels(id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_channels_active ON youtube_channels(is_active);

-- Add comment for documentation
COMMENT ON TABLE youtube_channels IS 'Manages multiple YouTube channels for content import';
COMMENT ON COLUMN videos.channel_id IS 'Reference to the source YouTube channel';

-- Verify the migration
SELECT 'youtube_channels table created' AS status
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'youtube_channels'
);
