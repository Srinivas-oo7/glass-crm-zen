import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ContactDetailsPanel from "@/components/ContactDetailsPanel";

interface Contact {
  id: string;
  name: string;
  company: string | null;
  status: string;
  lead_score: number;
  industry: string | null;
  intent: string | null;
  deal_value: number | null;
  next_followup_at: string | null;
  isNew?: boolean;
}

const ContactsTile = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .order('lead_score', { ascending: false })
        .limit(10);
      
      if (data) {
        // Remove duplicates by id
        const uniqueContacts = data.filter((contact, index, self) =>
          index === self.findIndex((c) => c.id === contact.id)
        );
        setContacts(uniqueContacts);
      }
    };

    fetchContacts();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('leads-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'leads' 
      }, (payload) => {
        // Add new lead with glow animation
        const newContact = { ...payload.new as Contact, isNew: true };
        setContacts(prev => {
          const exists = prev.some(c => c.id === newContact.id);
          if (exists) return prev;
          const updated = [newContact, ...prev].slice(0, 10);
          return updated;
        });
        
        // Remove glow after 3 seconds
        setTimeout(() => {
          setContacts(prev => prev.map(c => 
            c.id === newContact.id ? { ...c, isNew: false } : c
          ));
        }, 3000);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
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

  const formatCurrency = (value: number | null) => {
    if (!value) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "No follow-up";
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return "Overdue";
    return `${diffDays}d`;
  };

  const handleContactClick = (contactId: string) => {
    setSelectedContactId(contactId);
    setPanelOpen(true);
  };

  return (
    <>
      <div className="glass-tile gradient-contacts p-4 hover-scale h-full flex flex-col">
        <h2 className="text-lg font-semibold mb-3">Contacts</h2>
        
        <div className="space-y-2 overflow-auto custom-scrollbar flex-1">
          {contacts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No contacts yet</p>
          ) : (
            contacts.map((contact) => (
              <Card
                key={contact.id}
                onClick={() => handleContactClick(contact.id)}
                className={`p-3 bg-white/60 border-white/40 hover:bg-white/80 transition-all cursor-pointer ${
                  contact.isNew ? 'animate-pulse ring-2 ring-primary/50 shadow-[0_0_20px_rgba(0,122,255,0.3)]' : ''
                }`}
              >
                <div className="grid grid-cols-5 gap-2 items-center text-xs">
                  <div className="col-span-1 min-w-0">
                    <p className="font-medium truncate">{contact.name}</p>
                  </div>
                  <div className="col-span-1 min-w-0">
                    <p className="text-muted-foreground truncate">
                      {contact.company || 'N/A'}
                    </p>
                  </div>
                  <div className="col-span-1 min-w-0">
                    <p className="text-muted-foreground truncate">
                      {contact.intent ? contact.intent.slice(0, 30) + '...' : 'No intent'}
                    </p>
                  </div>
                  <div className="col-span-1">
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {formatDate(contact.next_followup_at)}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-right">
                    <p className="font-semibold text-success">
                      {formatCurrency(contact.deal_value)}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <ContactDetailsPanel 
        contactId={selectedContactId}
        open={panelOpen}
        onOpenChange={setPanelOpen}
      />
    </>
  );
};

export default ContactsTile;
