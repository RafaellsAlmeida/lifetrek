-- Social content no longer waits in the manual approval queue.
-- Any LinkedIn/Instagram record still written as pending_approval is normalized
-- to approved so it remains visible in approved flows without polluting pending review.

CREATE OR REPLACE FUNCTION public.normalize_social_approval_status()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'pending_approval' THEN
    NEW.status := 'approved';
  END IF;

  IF NEW.status = 'approved' AND NEW.approved_at IS NULL THEN
    NEW.approved_at := timezone('utc', now());
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.linkedin_carousels
SET
  status = 'approved',
  approved_at = COALESCE(approved_at, timezone('utc', now()))
WHERE status = 'pending_approval';

UPDATE public.instagram_posts
SET
  status = 'approved',
  approved_at = COALESCE(approved_at, timezone('utc', now()))
WHERE status = 'pending_approval';

DROP TRIGGER IF EXISTS trg_normalize_social_approval_status_on_linkedin
  ON public.linkedin_carousels;
CREATE TRIGGER trg_normalize_social_approval_status_on_linkedin
  BEFORE INSERT OR UPDATE ON public.linkedin_carousels
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_social_approval_status();

DROP TRIGGER IF EXISTS trg_normalize_social_approval_status_on_instagram
  ON public.instagram_posts;
CREATE TRIGGER trg_normalize_social_approval_status_on_instagram
  BEFORE INSERT OR UPDATE ON public.instagram_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_social_approval_status();
