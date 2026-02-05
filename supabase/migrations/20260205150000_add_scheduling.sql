-- Add scheduled_date to linkedin_carousels
ALTER TABLE IF EXISTS linkedin_carousels 
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;

-- Add check constraint for 'scheduled' status if not exists
-- Note: We drop the old constraint to allow the new 'scheduled' status
DO $$ 
BEGIN
    ALTER TABLE linkedin_carousels DROP CONSTRAINT IF EXISTS linkedin_posts_status_check; -- Old name
    ALTER TABLE linkedin_carousels DROP CONSTRAINT IF EXISTS linkedin_carousels_status_check;
    
    ALTER TABLE linkedin_carousels 
    ADD CONSTRAINT linkedin_carousels_status_check 
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'published', 'archived'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;


-- Define Instagram Posts Table (if not exists)
CREATE TABLE IF NOT EXISTS instagram_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  caption TEXT,
  hashtags TEXT[],
  post_type TEXT CHECK (post_type IN ('feed', 'story', 'reel')),
  target_audience TEXT,
  pain_point TEXT,
  desired_outcome TEXT,
  
  -- Workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'published', 'archived')),
  scheduled_date TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Instagram
ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access instagram" ON instagram_posts FOR ALL USING (auth.role() = 'authenticated');


-- Define Resources Table (if not exists)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  type TEXT,
  
  -- Workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'scheduled', 'published', 'archived')),
  scheduled_date TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins full access resources" ON resources FOR ALL USING (auth.role() = 'authenticated');


-- Add scheduled_date to blog_posts
ALTER TABLE IF EXISTS blog_posts 
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;

-- Update blog_posts status check
DO $$ 
BEGIN
    ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
    ALTER TABLE blog_posts 
    ADD CONSTRAINT blog_posts_status_check 
    CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'scheduled', 'archived'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
