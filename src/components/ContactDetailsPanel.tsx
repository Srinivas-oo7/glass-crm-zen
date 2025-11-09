import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Building2, Mail, Phone, Globe, Calendar, DollarSign, Target } from "lucide-react";

interface Contact {
  id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  website: string | null;
  status: string;
  lead_score: number;
  industry: string | null;
  intent: string | null;
  deal_value: number | null;
  next_followup_at: string | null;
  created_at: string;
}

interface ContactDetailsPanelProps {
  contactId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactDetailsPanel = ({ contactId, open, onOpenChange }: ContactDetailsPanelProps) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (contactId && open) {
      fetchContactDetails();
      generateAiSummary();
    }
  }, [contactId, open]);

  const fetchContactDetails = async () => {
    if (!contactId) return;
    
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('id', contactId)
      .single();
    
    if (data) setContact(data);
  };

  const generateAiSummary = async () => {
    if (!contactId) return;
    
    setLoading(true);
    try {
      const { data } = await supabase.functions.invoke('get-ai-summary', {
        body: { contactId }
      });
      
      if (data?.summary) {
        setAiSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      setAiSummary("Unable to generate AI summary at this time.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {contact ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-2xl">{contact.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{contact.status}</Badge>
                <Badge variant="outline">Score: {contact.lead_score}/100</Badge>
              </div>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* AI Summary */}
              <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  AI Summary
                </h3>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{aiSummary}</p>
                )}
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Contact Information</h3>
                
                {contact.email && (
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                    </div>
                  </div>
                )}

                {contact.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{contact.phone}</p>
                    </div>
                  </div>
                )}

                {contact.company && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Company</p>
                      <p className="text-sm text-muted-foreground">{contact.company}</p>
                      {contact.industry && (
                        <p className="text-xs text-muted-foreground mt-1">{contact.industry}</p>
                      )}
                    </div>
                  </div>
                )}

                {contact.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Website</p>
                      <a 
                        href={contact.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {contact.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Deal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Deal Details</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Deal Value</p>
                      <p className="text-lg font-semibold text-success">
                        {formatCurrency(contact.deal_value)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Next Follow-up</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(contact.next_followup_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {contact.intent && (
                  <div>
                    <p className="text-sm font-medium mb-1">Intent</p>
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      {contact.intent}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Timeline</h3>
                <p className="text-sm text-muted-foreground">
                  Added on {formatDate(contact.created_at)}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ContactDetailsPanel;