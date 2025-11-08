import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Contact {
  id: string;
  name: string;
  company: string | null;
  status: string;
  lead_score: number;
  industry: string | null;
}

const ContactsTile = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const fetchContacts = async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('lead_score', { ascending: false })
        .limit(5);
      
      if (data) setContacts(data);
    };

    fetchContacts();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'leads' 
      }, () => {
        fetchContacts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "bg-success/10 text-success hover:bg-success/20";
    if (score >= 40) return "bg-warning/10 text-warning hover:bg-warning/20";
    return "bg-muted text-muted-foreground hover:bg-muted";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  return (
    <div className="glass-tile gradient-contacts p-4 hover-scale h-full flex flex-col">
      <h2 className="text-lg font-semibold mb-3">Contacts</h2>
      
      <div className="space-y-2 overflow-auto custom-scrollbar flex-1">
        {contacts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No contacts yet</p>
        ) : (
          contacts.map((contact) => (
            <Card
              key={contact.id}
              className="p-3 bg-white/60 border-white/40 hover:bg-white/80 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{contact.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {contact.company || contact.industry || 'Unknown'}
                  </p>
                </div>
                <Badge className={`${getScoreColor(contact.lead_score)} text-xs`}>
                  {getScoreLabel(contact.lead_score)}
                </Badge>
                <p className="font-semibold text-sm">{contact.status}</p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactsTile;
