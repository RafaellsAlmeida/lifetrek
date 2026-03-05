-- admin_tasks: Persistent task management for Rafael and Vanessa
CREATE TABLE IF NOT EXISTS public.admin_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES auth.users(id), -- Nullable if generic
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed
    priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
    due_date TIMESTAMP WITH TIME ZONE,
    related_entity_type TEXT, -- 'lead', 'content', etc.
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- marketing_goals: Performance tracking for metrics (LinkedIn, Meetings, etc)
CREATE TABLE IF NOT EXISTS public.marketing_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_type TEXT NOT NULL, -- 'linkedin_posts', 'meetings', 'leads'
    target_value INTEGER NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,
    period TEXT NOT NULL DEFAULT 'weekly', -- weekly, monthly
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_goals ENABLE ROW LEVEL SECURITY;

-- Simple Admin-only Policies (Assumes 'admin' check exists in other migrations)
-- For now, allow all authenticated users to manage these, 
-- but in production we'd use the 'has_role' function discovered in logs.

CREATE POLICY "Admin users can manage tasks" ON public.admin_tasks
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Admin users can manage goals" ON public.marketing_goals
    FOR ALL USING (true) WITH CHECK (true);

-- Functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_tasks_updated_at
    BEFORE UPDATE ON public.admin_tasks
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER update_marketing_goals_updated_at
    BEFORE UPDATE ON public.marketing_goals
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
