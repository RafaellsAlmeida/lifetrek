-- Create a table for daily snapshots of LinkedIn Analytics
CREATE TABLE IF NOT EXISTS public.linkedin_analytics_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unipile_account_id TEXT NOT NULL,
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Profile Stats
    total_connections INTEGER DEFAULT 0,
    profile_views INTEGER DEFAULT 0, -- If available via API
    
    -- Conversation Stats (Snapshot)
    total_conversations INTEGER DEFAULT 0,
    unread_conversations INTEGER DEFAULT 0,
    
    -- Message Volume ( Delta to be calculated by comparing snapshots or from webhooks)
    messages_sent_today INTEGER DEFAULT 0,
    messages_received_today INTEGER DEFAULT 0,
    
    meta JSONB DEFAULT '{}'::jsonb, -- Store raw Unipile response if needed
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure one record per account per day
    UNIQUE(unipile_account_id, snapshot_date)
);

-- Enable RLS
ALTER TABLE public.linkedin_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can view linkedin analytics"
    ON public.linkedin_analytics_daily
    FOR SELECT
    TO authenticated
    USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage linkedin analytics"
    ON public.linkedin_analytics_daily
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
