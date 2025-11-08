import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, Building2, Calendar, MessageSquare, TrendingUp } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  industry: string | null;
  status: string;
  lead_score: number;
  sentiment_score: number;
  notes: string | null;
  source: string;
  created_at: string;
  last_contacted_at: string | null;
  next_followup_at: string | null;
  last_reply_at: string | null;
  unresponsive_days: number;
}

interface EmailCampaign {
  id: string;
  subject: string;
  body: string;
  draft_status: string;
  sent_at: string | null;
  created_at: string;
}

interface Meeting {
  id: string;
  title: string;
  scheduled_at: string;
  status: string;
  outcome: string | null;
}

const LeadDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchLeadDetails();
    }
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);

      // Fetch lead details
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (leadError) throw leadError;
      setLead(leadData);

      // Fetch email campaigns
      const { data: campaignsData } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('lead_id', id)
        .order('created_at', { ascending: false });

      setCampaigns(campaignsData || []);

      // Fetch meetings
      const { data: meetingsData } = await supabase
        .from('meetings')
        .select('*')
        .eq('lead_id', id)
        .order('scheduled_at', { ascending: false });

      setMeetings(meetingsData || []);

    } catch (error) {
      console.error('Error fetching lead details:', error);
      toast({
        title: "Error",
        description: "Failed to load lead details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500',
      contacted: 'bg-yellow-500',
      qualified: 'bg-green-500',
      proposal: 'bg-purple-500',
      negotiation: 'bg-orange-500',
      won: 'bg-emerald-500',
      lost: 'bg-red-500',
    };
    return <Badge className={colors[status] || 'bg-gray-500'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading lead details...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Lead not found</h2>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Lead Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{lead.name}</CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {lead.company && (
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      <span>{lead.company}</span>
                    </div>
                  )}
                  {lead.industry && <Badge variant="outline">{lead.industry}</Badge>}
                </div>
              </div>
              <div className="text-right space-y-2">
                {getStatusBadge(lead.status)}
                <div className="text-sm text-muted-foreground">
                  Lead Score: <span className="font-bold text-foreground">{lead.lead_score}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{lead.phone}</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <div className="text-xs text-muted-foreground">Source</div>
                <div className="font-medium capitalize">{lead.source.replace('_', ' ')}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Sentiment</div>
                <div className="font-medium flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {(lead.sentiment_score * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Last Contact</div>
                <div className="font-medium">
                  {lead.last_contacted_at
                    ? new Date(lead.last_contacted_at).toLocaleDateString()
                    : 'Never'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Next Follow-up</div>
                <div className="font-medium">
                  {lead.next_followup_at
                    ? new Date(lead.next_followup_at).toLocaleDateString()
                    : 'Not scheduled'}
                </div>
              </div>
            </div>

            {/* Notes */}
            {lead.notes && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Notes</span>
                </div>
                <p className="text-sm text-muted-foreground">{lead.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Campaigns ({campaigns.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <p className="text-muted-foreground text-sm">No email campaigns yet</p>
            ) : (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">{campaign.subject}</div>
                      <Badge variant={campaign.sent_at ? 'default' : 'secondary'}>
                        {campaign.draft_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.body}
                    </p>
                    <div className="text-xs text-muted-foreground mt-2">
                      {campaign.sent_at
                        ? `Sent ${new Date(campaign.sent_at).toLocaleString()}`
                        : `Created ${new Date(campaign.created_at).toLocaleString()}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Meetings ({meetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {meetings.length === 0 ? (
              <p className="text-muted-foreground text-sm">No meetings scheduled</p>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="border-l-4 border-purple-500 pl-4 py-2">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium">{meeting.title}</div>
                      <Badge>{meeting.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Scheduled: {new Date(meeting.scheduled_at).toLocaleString()}
                    </div>
                    {meeting.outcome && (
                      <div className="text-sm mt-2">
                        <span className="font-medium">Outcome:</span> {meeting.outcome}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadDetails;
