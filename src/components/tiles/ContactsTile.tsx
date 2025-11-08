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
    <div className="glass-tile gradient-contacts p-6 hover-scale h-full overflow-auto custom-scrollbar">
      <h2 className="text-xl font-semibold mb-4">Contacts</h2>
      
      <div className="space-y-3">
        {contacts.map((contact) => (
          <Card
            key={contact.id}
            className="p-4 bg-white/60 border-white/40 hover:bg-white/80 transition-all cursor-pointer"
          >
            <div className="grid grid-cols-5 gap-4 items-center">
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-sm text-muted-foreground">{contact.company}</p>
              </div>
              <div className="flex justify-center">
                <Badge className={getIntentColor(contact.intent)}>
                  {contact.intent}
                </Badge>
              </div>
              <p className="text-sm text-center">{contact.followUpDate}</p>
              <p className="font-semibold text-center">{contact.dealValue}</p>
              <div className="flex justify-end">
                <button className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContactsTile;
