
-- Add pillar column for strategy alignment (Identity, Capabilities, Trust)
ALTER TABLE content_templates ADD COLUMN IF NOT EXISTS pillar text;

-- Add image_url column for storing generated/edited image paths
ALTER TABLE content_templates ADD COLUMN IF NOT EXISTS image_url text;

-- Ensure status can handle 'rejected' (it's text, so likely fine, but good to note)
-- Existing columns: status, rejected_at, rejected_by, rejection_reason are already present.
