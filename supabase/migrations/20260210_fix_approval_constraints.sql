-- Fix status constraints for content approval workflow
-- Allows 'approved' and 'published' statuses for resources and instagram_posts

-- 1. Update RESOURCES table constraints if they exist (dropping to be safe/sure)
ALTER TABLE IF EXISTS public.resources DROP CONSTRAINT IF EXISTS resources_status_check;
ALTER TABLE public.resources ADD CONSTRAINT resources_status_check 
  CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'published', 'scheduled'));

-- 2. Update INSTAGRAM_POSTS table constraints if they exist
ALTER TABLE IF EXISTS public.instagram_posts DROP CONSTRAINT IF EXISTS instagram_posts_status_check;
ALTER TABLE public.instagram_posts ADD CONSTRAINT instagram_posts_status_check 
  CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'published', 'scheduled', 'archived'));

-- 3. Update LINKEDIN_CAROUSELS table constraints (just in case)
ALTER TABLE IF EXISTS public.linkedin_carousels DROP CONSTRAINT IF EXISTS linkedin_carousels_status_check;
ALTER TABLE public.linkedin_carousels ADD CONSTRAINT linkedin_carousels_status_check 
  CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'published', 'scheduled', 'archived'));

-- 4. Update BLOG_POSTS table constraints (just in case)
ALTER TABLE IF EXISTS public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_status_check 
  CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'published', 'scheduled', 'archived'));
