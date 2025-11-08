import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Send, Trash2, Edit, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EmailCampaignsViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface EmailCampaign {
  id: string;
  subject: string;
  body: string;
  draft_status: string;
  sent_at: string | null;
  created_at: string;
  lead_id: string;
  leads: {
    name: string;
    email: string;
    company: string | null;
  };
}

const EmailCampaignsView = ({ open, onOpenChange }: EmailCampaignsViewProps) => {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCampaigns();
    }
  }, [open]);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_campaigns')
        .select('*, leads(name, email, company)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load email campaigns",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (campaignId: string, leadEmail: string, subject: string, body: string) => {
    setSendingId(campaignId);
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: leadEmail,
          subject,
          body,
          campaignId
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: `Email sent successfully to ${leadEmail}`,
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive"
      });
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('email_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "Email draft deleted successfully",
      });

      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, sentAt: string | null) => {
    if (sentAt) return <Badge className="bg-green-500">Sent</Badge>;
    if (status === 'approved') return <Badge className="bg-blue-500">Approved</Badge>;
    if (status === 'pending') return <Badge variant="secondary">Pending</Badge>;
    return <Badge variant="outline">Draft</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-tile max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Campaigns
          </DialogTitle>
          <DialogDescription>
            Manage and send email campaigns to your leads
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No email campaigns yet</p>
              <p className="text-sm">Ask the AI assistant to draft an email</p>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{campaign.subject}</h4>
                      <p className="text-sm text-muted-foreground">
                        To: {campaign.leads.name} ({campaign.leads.email})
                        {campaign.leads.company && ` - ${campaign.leads.company}`}
                      </p>
                    </div>
                    {getStatusBadge(campaign.draft_status, campaign.sent_at)}
                  </div>

                  <div className="bg-muted/30 rounded-lg p-3 mb-3 max-h-32 overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{campaign.body}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {campaign.sent_at 
                        ? `Sent ${new Date(campaign.sent_at).toLocaleDateString()}`
                        : `Created ${new Date(campaign.created_at).toLocaleDateString()}`
                      }
                    </p>
                    
                    {!campaign.sent_at && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(campaign.id)}
                          className="rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSend(
                            campaign.id,
                            campaign.leads.email,
                            campaign.subject,
                            campaign.body
                          )}
                          disabled={sendingId === campaign.id}
                          className="rounded-lg"
                        >
                          {sendingId === campaign.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Send
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EmailCampaignsView;
