import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface Contact {
  id: number;
  name: string;
  company: string;
  intent: "High" | "Medium" | "Low";
  followUpDate: string;
  dealValue: string;
}

const ContactsTile = () => {
  const [contacts] = useState<Contact[]>([
    { id: 1, name: "Alice Johnson", company: "TechCorp", intent: "High", followUpDate: "2025-11-10", dealValue: "$45K" },
    { id: 2, name: "Bob Smith", company: "StartupXYZ", intent: "Medium", followUpDate: "2025-11-12", dealValue: "$28K" },
    { id: 3, name: "Carol White", company: "BigCo", intent: "High", followUpDate: "2025-11-09", dealValue: "$67K" },
    { id: 4, name: "David Brown", company: "MediumBiz", intent: "Low", followUpDate: "2025-11-15", dealValue: "$12K" },
    { id: 5, name: "Eve Wilson", company: "Enterprise Ltd", intent: "High", followUpDate: "2025-11-11", dealValue: "$89K" },
  ]);

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case "High":
        return "bg-success/10 text-success hover:bg-success/20";
      case "Medium":
        return "bg-warning/10 text-warning hover:bg-warning/20";
      case "Low":
        return "bg-muted text-muted-foreground hover:bg-muted";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="glass-tile gradient-contacts p-4 hover-scale h-full flex flex-col overflow-hidden">
      <h2 className="text-base font-semibold mb-2">Contacts</h2>
      
      <div className="overflow-auto custom-scrollbar flex-1 space-y-2">
        {contacts.map((contact) => (
          <Card
            key={contact.id}
            className="p-2 bg-white/60 border-white/40 hover:bg-white/80 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-xs truncate">{contact.name}</p>
                <p className="text-xs text-muted-foreground truncate">{contact.company}</p>
              </div>
              <Badge className={`${getIntentColor(contact.intent)} text-xs shrink-0`}>
                {contact.intent}
              </Badge>
              <p className="font-semibold text-xs shrink-0">{contact.dealValue}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContactsTile;
