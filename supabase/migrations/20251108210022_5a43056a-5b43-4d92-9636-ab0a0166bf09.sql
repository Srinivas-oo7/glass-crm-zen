-- Create manager profile table (single user)
CREATE TABLE IF NOT EXISTS public.manager_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  calendar_sync_token TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  industry TEXT,
  source TEXT NOT NULL CHECK (source IN ('social', 'scraping', 'ads', 'manual')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'responded', 'converted', 'meeting_scheduled', 'closed', 'lost')),
  sentiment_score DECIMAL(3,2) DEFAULT 0.5,
  lead_score INTEGER DEFAULT 0,
  linkedin_url TEXT,
  twitter_handle TEXT,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_contacted_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ
);

-- Create email campaigns table
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  draft_status TEXT NOT NULL DEFAULT 'draft' CHECK (draft_status IN ('draft', 'approved', 'sent', 'rejected')),
  agent_notes TEXT,
  manager_feedback TEXT,
  scheduled_send_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create email tracking table
CREATE TABLE IF NOT EXISTS public.email_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  reply_content TEXT,
  reply_sentiment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  google_meet_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  agent_joined_at TIMESTAMPTZ,
  manager_joined_at TIMESTAMPTZ,
  meeting_duration INTEGER,
  transcript TEXT,
  sentiment_analysis JSONB,
  outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create agent actions table
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL CHECK (agent_type IN ('lead_generation', 'email_drafter', 'followup', 'meeting_scheduler', 'meeting_agent')),
  action_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'requires_approval')),
  data JSONB DEFAULT '{}'::jsonb,
  requires_approval BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create UI state table
CREATE TABLE IF NOT EXISTS public.ui_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  active_tile TEXT,
  expanded_tiles JSONB DEFAULT '[]'::jsonb,
  voice_mode_active BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.manager_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ui_state ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (single user CRM, no auth for MVP)
CREATE POLICY "Allow all operations on manager_profile" ON public.manager_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on email_campaigns" ON public.email_campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on email_tracking" ON public.email_tracking FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on meetings" ON public.meetings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on agent_actions" ON public.agent_actions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on ui_state" ON public.ui_state FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_manager_profile_updated_at BEFORE UPDATE ON public.manager_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON public.email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ui_state_updated_at BEFORE UPDATE ON public.ui_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.email_campaigns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_actions;

-- Insert sample manager profile
INSERT INTO public.manager_profile (email, name) VALUES ('manager@crm-x.com', 'CRM Manager') ON CONFLICT DO NOTHING;

-- Insert sample leads for demo
INSERT INTO public.leads (name, email, company, industry, source, status, lead_score) VALUES
  ('John Smith', 'john@techcorp.com', 'TechCorp Inc', 'Technology', 'scraping', 'new', 85),
  ('Sarah Johnson', 'sarah@startupco.com', 'StartupCo', 'SaaS', 'scraping', 'new', 92),
  ('Mike Chen', 'mike@enterprise.com', 'Enterprise Solutions', 'Enterprise', 'scraping', 'contacted', 78)
ON CONFLICT DO NOTHING;