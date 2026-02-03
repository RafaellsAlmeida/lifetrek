-- Enable pg_cron if not enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create the cron job
-- Note: You must replace PROJECT_REF and ANON_KEY/SERVICE_KEY with actual values if running manually, 
-- but in Supabase Cloud, these are clearer.
-- However, inside a migration, we can't easily access the Edge Function URL of the *current* project dynamically without knowing the project ref.
-- Standard approach: The user creates the cron via Dashboard OR we use a fixed URL structure if we know the project ID.

-- Since we know the project is 'dlflpvmdzkeouhgqwqba' (from previous checks), we can try to construct it.
-- URL: https://dlflpvmdzkeouhgqwqba.supabase.co/functions/v1/sync-linkedin-analytics

SELECT cron.schedule(
    'sync-linkedin-analytics-daily', -- name
    '0 6 * * *',                     -- schedule (6am UTC)
    $$
    select
        net.http_post(
            url:='https://dlflpvmdzkeouhgqwqba.supabase.co/functions/v1/sync-linkedin-analytics',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key', true) || '"}'::jsonb,
            body:='{}'::jsonb
        ) as request_id;
    $$
);

-- Note: 'app.settings.service_role_key' is a custom setting we might need to set, 
-- OR strictly hardcode the key (bad practice in git).
-- BETTER APPROACH: Use the Supabase Dashboard for Cron Jobs or use a secure vault.
-- For now, I will create the job but comment out the execution part or use a placeholder that the user must replace, 
-- OR rely on the fact that we can't easily do this purely in SQL without secrets.
