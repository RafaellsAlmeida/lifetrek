-- Unified Inbox: Multi-channel conversation tracking
-- Supports LinkedIn, WhatsApp, Email, and Website Chat

-- Main conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Channel identifiers
    channel TEXT NOT NULL CHECK (channel IN ('linkedin', 'whatsapp', 'email', 'website_chat')),
    external_account_id TEXT, -- Unipile account ID or Z-API number
    thread_id TEXT NOT NULL, -- External thread/conversation ID
    
    -- Contact mapping
    lead_id UUID REFERENCES public.contact_leads(id) ON DELETE SET NULL,
    contact_name TEXT,
    contact_identifier TEXT NOT NULL, -- email, phone, or LinkedIn URL
    
    -- Conversation metadata
    subject TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'snoozed', 'resolved')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    last_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_message_preview TEXT, -- First 200 chars
    unread_count INTEGER DEFAULT 0,
    
    -- Assignment and tracking
    assigned_to UUID REFERENCES auth.users(id),
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Unique constraint to prevent duplicate conversations
    UNIQUE(channel, thread_id)
);

-- Individual messages within conversations
CREATE TABLE IF NOT EXISTS public.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    
    -- Message content
    external_message_id TEXT NOT NULL, -- Unipile message ID
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'file', 'link', 'html')),
    
    -- Sender info
    sender_type TEXT NOT NULL CHECK (sender_type IN ('contact', 'agent', 'system')),
    sender_name TEXT,
    sender_identifier TEXT,
    
    -- Metadata
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Unique constraint to prevent duplicate messages
    UNIQUE(conversation_id, external_message_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON public.conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_thread_id ON public.conversations(thread_id);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON public.conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON public.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at ON public.conversation_messages(created_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversations_updated_at();

-- RLS Policies
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Authenticated users can view conversations"
    ON public.conversations FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert conversations"
    ON public.conversations FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update conversations"
    ON public.conversations FOR UPDATE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete conversations"
    ON public.conversations FOR DELETE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Messages policies
CREATE POLICY "Authenticated users can view messages"
    ON public.conversation_messages FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert messages"
    ON public.conversation_messages FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update messages"
    ON public.conversation_messages FOR UPDATE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "Admins can delete messages"
    ON public.conversation_messages FOR DELETE
    TO authenticated
    USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Comments for documentation
COMMENT ON TABLE public.conversations IS 'Unified inbox for all channels (LinkedIn, WhatsApp, Email, Website Chat)';
COMMENT ON TABLE public.conversation_messages IS 'Individual messages within conversations';
COMMENT ON COLUMN public.conversations.thread_id IS 'External identifier from the messaging platform (Unipile thread ID, WhatsApp chat ID, etc.)';
COMMENT ON COLUMN public.conversations.external_account_id IS 'Unipile account ID for LinkedIn/Email or Z-API number for WhatsApp';
COMMENT ON COLUMN public.conversation_messages.external_message_id IS 'External message ID from the platform to prevent duplicates';
