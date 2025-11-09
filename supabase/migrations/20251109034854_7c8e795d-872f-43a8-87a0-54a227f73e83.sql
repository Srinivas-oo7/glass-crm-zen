-- Add new columns to leads table for intent and deal value
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS intent TEXT,
ADD COLUMN IF NOT EXISTS deal_value NUMERIC DEFAULT 0;

-- Create deals table
CREATE TABLE IF NOT EXISTS public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'qualified',
  value NUMERIC DEFAULT 0,
  close_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- Create policy for deals (public access for demo)
CREATE POLICY "Allow all operations on deals" 
ON public.deals 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create company_profile table
CREATE TABLE IF NOT EXISTS public.company_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  industry TEXT,
  target_industries JSONB DEFAULT '[]'::jsonb,
  target_roles JSONB DEFAULT '[]'::jsonb,
  keywords JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on company_profile
ALTER TABLE public.company_profile ENABLE ROW LEVEL SECURITY;

-- Create policy for company_profile
CREATE POLICY "Allow all operations on company_profile" 
ON public.company_profile 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for deals updated_at
CREATE TRIGGER update_deals_updated_at
BEFORE UPDATE ON public.deals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for company_profile updated_at
CREATE TRIGGER update_company_profile_updated_at
BEFORE UPDATE ON public.company_profile
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for leads and deals
ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;