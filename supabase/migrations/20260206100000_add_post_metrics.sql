-- Add metrics columns to linkedin_carousels
ALTER TABLE IF EXISTS linkedin_carousels 
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS shares INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS engagement_rate NUMERIC DEFAULT 0;

-- Create an index on views for sorting
CREATE INDEX IF NOT EXISTS idx_linkedin_carousels_views ON linkedin_carousels (views DESC);
