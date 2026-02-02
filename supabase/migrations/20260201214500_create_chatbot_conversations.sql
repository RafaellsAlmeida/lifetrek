-- Create a simple table for website chatbot logs without strict foreign key constraints
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for querying by session
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id ON public.chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_created_at ON public.chatbot_conversations(created_at DESC);

-- RLS Policies
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (since it's a public chatbot)
CREATE POLICY "Public can insert chatbot messages"
    ON public.chatbot_conversations FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Only admins can view logs
CREATE POLICY "Admins can view chatbot messages"
    ON public.chatbot_conversations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
        ) 
        OR 
        EXISTS (
             SELECT 1 FROM public.admin_permissions WHERE email = auth.jwt()->>'email'
        )
    );
