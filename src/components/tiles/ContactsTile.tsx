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
    if (score >= 70) return "bg-green-500/20 text-green-300 border-green-500/30";
    if (score >= 40) return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    return "bg-gray-500/20 text-gray-300 border-gray-500/30";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "High";
    if (score >= 40) return "Medium";
    return "Low";
  };

  return (
    <div className="widget-card p-5 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-white">Top Contacts</h2>
      
      <div className="space-y-3 overflow-auto flex-1">
        {contacts.length === 0 ? (
          <p className="text-white/50 text-sm">No contacts yet</p>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-black/30 rounded-xl p-4 hover:bg-black/40 transition-all cursor-pointer border border-white/10"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-base truncate">{contact.name}</p>
                  <p className="text-sm text-white/60 truncate">
                    {contact.company || contact.industry || 'Unknown'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={`${getScoreColor(contact.lead_score)} text-xs border`}>
                    {getScoreLabel(contact.lead_score)}
                  </Badge>
                  <span className="text-xs text-white/40">{contact.status}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactsTile;
