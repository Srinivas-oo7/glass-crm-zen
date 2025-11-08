-- Create email_replies table to track incoming email responses
CREATE TABLE public.email_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  reply_content TEXT NOT NULL,
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score >= 0 AND sentiment_score <= 1),
  requires_manager_review BOOLEAN DEFAULT true,
  draft_response TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'sent', 'rejected')),
  replied_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_email_replies_lead_id ON public.email_replies(lead_id);
CREATE INDEX idx_email_replies_status ON public.email_replies(status);

-- Create agent_runs table to track background agent activity
CREATE TABLE public.agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL CHECK (agent_type IN ('lead_scoring', 'email_monitoring', 'meeting_prep', 'follow_up', 'deal_pipeline')),
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  actions_taken JSONB DEFAULT '[]'::jsonb,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_agent_runs_agent_type ON public.agent_runs(agent_type);
CREATE INDEX idx_agent_runs_started_at ON public.agent_runs(started_at DESC);

-- Add columns to meetings table for AI agent functionality
ALTER TABLE public.meetings 
ADD COLUMN IF NOT EXISTS ai_agent_confidence_score DECIMAL(3,2) CHECK (ai_agent_confidence_score >= 0 AND ai_agent_confidence_score <= 1),
ADD COLUMN IF NOT EXISTS manager_alert_triggered BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS manager_alert_reason TEXT,
ADD COLUMN IF NOT EXISTS real_time_transcript JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS conversation_summary TEXT,
ADD COLUMN IF NOT EXISTS agent_notes TEXT;

-- Add columns to email_campaigns table
ALTER TABLE public.email_campaigns
ADD COLUMN IF NOT EXISTS is_automated_followup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS followup_sequence_number INTEGER DEFAULT 0;

-- Add last_contacted_at to leads table for follow-up tracking
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_reply_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS unresponsive_days INTEGER DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.email_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies for email_replies (public access for now as this is a demo)
CREATE POLICY "Enable read access for all users" ON public.email_replies
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.email_replies
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.email_replies
  FOR UPDATE USING (true);

-- RLS policies for agent_runs
CREATE POLICY "Enable read access for all users" ON public.agent_runs
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.agent_runs
  FOR INSERT WITH CHECK (true);

-- Create trigger for updated_at on email_replies
CREATE TRIGGER update_email_replies_updated_at
  BEFORE UPDATE ON public.email_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();