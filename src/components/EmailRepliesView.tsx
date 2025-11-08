import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface EmailReply {
  id: string;
  reply_content: string;
  draft_response: string | null;
  sentiment_score: number | null;
  replied_at: string;
  status: string;
  lead_id: string;
  leads: {
    name: string;
    email: string;
    company: string | null;
  };
}

const EmailRepliesView = () => {
  const [replies, setReplies] = useState<EmailReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchReplies();
    
    const channel = supabase
      .channel('email-replies-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'email_replies' 
      }, () => fetchReplies())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReplies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('email_replies')
        .select('*, leads(name, email, company)')
        .eq('status', 'pending')
        .order('replied_at', { ascending: false });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (replyId: string, leadEmail: string, draftResponse: string) => {
    setProcessingId(replyId);
    try {
      await supabase
        .from('email_replies')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', replyId);

      const { error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          to: leadEmail,
          subject: 'Re: Our Conversation',
          body: draftResponse
        }
      });

      if (sendError) throw sendError;

      toast({
        title: "Reply Approved",
        description: "Email sent successfully",
      });

      fetchReplies();
    } catch (error) {
      console.error('Error approving reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (replyId: string) => {
    setProcessingId(replyId);
    try {
      await supabase
        .from('email_replies')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', replyId);

      toast({
        title: "Reply Rejected",
        description: "Draft response rejected",
      });

      fetchReplies();
    } catch (error) {
      console.error('Error rejecting reply:', error);
      toast({
        title: "Error",
        description: "Failed to reject reply",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getSentimentBadge = (score: number | null) => {
    if (!score) return <Badge variant="outline">Unknown</Badge>;
    if (score >= 0.7) return <Badge className="bg-success/10 text-success">Positive</Badge>;
    if (score >= 0.4) return <Badge className="bg-warning/10 text-warning">Neutral</Badge>;
    return <Badge className="bg-destructive/10 text-destructive">Negative</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (replies.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No pending email replies</p>
        <p className="text-sm">AI will auto-detect and draft responses</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Pending Email Replies ({replies.length})</h3>
      </div>

      {replies.map((reply) => (
        <Card key={reply.id} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-semibold">{reply.leads.name}</h4>
              <p className="text-sm text-muted-foreground">
                {reply.leads.email}
                {reply.leads.company && ` - ${reply.leads.company}`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Replied {new Date(reply.replied_at).toLocaleString()}
              </p>
            </div>
            {getSentimentBadge(reply.sentiment_score)}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Their Message:</p>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{reply.reply_content}</p>
              </div>
            </div>

            {reply.draft_response && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">AI Draft Response:</p>
                  <div className="bg-primary/5 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{reply.draft_response}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleReject(reply.id)}
              disabled={processingId === reply.id}
              className="flex-1"
            >
              {processingId === reply.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => handleApprove(reply.id, reply.leads.email, reply.draft_response || '')}
              disabled={processingId === reply.id || !reply.draft_response}
              className="flex-1"
            >
              {processingId === reply.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  Approve & Send
                </>
              )}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default EmailRepliesView;
