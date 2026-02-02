-- Rename table linkedin_posts to linkedin_carousels to match application code
ALTER TABLE IF EXISTS linkedin_posts RENAME TO linkedin_carousels;

-- Rename indexes to keep things clean (optional but good practice)
ALTER INDEX IF EXISTS idx_linkedin_posts_status RENAME TO idx_linkedin_carousels_status;
ALTER INDEX IF EXISTS idx_linkedin_posts_created_at RENAME TO idx_linkedin_carousels_created_at;
ALTER INDEX IF EXISTS idx_linkedin_posts_created_by RENAME TO idx_linkedin_carousels_created_by;
ALTER INDEX IF EXISTS idx_linkedin_posts_post_type RENAME TO idx_linkedin_carousels_post_type;

-- Update triggers if any (naming convention update)
-- The trigger function 'update_linkedin_posts_updated_at' is generic-ish but bound to the table.
-- We usually drop and recreate or just rename the trigger if supported, but typically trigger names are local to table.
-- Let's just ensure the trigger exists on the new table name.
-- In Postgres, renaming a table auto-updates trigger references to the table, but the trigger NAME remains.

-- If we want to be pedantic about names:
ALTER TRIGGER linkedin_posts_updated_at ON linkedin_carousels RENAME TO linkedin_carousels_updated_at;

-- Re-create policies if needed? No, renaming table preserves policies.
-- But the policy names might be confusing.
-- "Admins have full access to linkedin posts" -> "Admins have full access to linkedin carousels"
-- Postgres doesn't auto-rename policy strings/identifiers easily in bulk, but they are just labels.
-- We will leave policy names as is to avoid conflict/maintenance overhead, or we can drop/recreate.
-- Let's leave policy names unless they cause issues.

-- Grant permissions again just in case? RLS stays with table.
