-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create resources table for the Central de Recursos Estratégicos
CREATE TABLE public.resources (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL CHECK (type IN ('checklist', 'guide', 'calculator')),
    persona TEXT,
    thumbnail_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    slug TEXT NOT NULL UNIQUE,
    metadata JSONB DEFAULT '{}',
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to published resources
CREATE POLICY "Published resources are viewable by everyone"
ON public.resources
FOR SELECT
USING (status = 'published');

-- Create policy for admin users to manage all resources
CREATE POLICY "Admin users can manage resources"
ON public.resources
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.admin_permissions 
        WHERE email = auth.jwt()->>'email'
    )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for faster lookups
CREATE INDEX idx_resources_slug ON public.resources(slug);
CREATE INDEX idx_resources_status ON public.resources(status);
CREATE INDEX idx_resources_type ON public.resources(type);