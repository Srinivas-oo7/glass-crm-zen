import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, Plus, Mail, Calendar } from "lucide-react";

interface TopNavProps {
  onSettingsClick: () => void;
  onAddLeadClick: () => void;
  onEmailsClick: () => void;
  onScheduleClick: () => void;
}

const TopNav = ({ onSettingsClick, onAddLeadClick, onEmailsClick, onScheduleClick }: TopNavProps) => {
  return (
    <nav className="glass-tile sticky top-4 mx-4 mb-6 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Zero-Click CRM</h1>
          <p className="text-sm text-muted-foreground">Your CRM that fills itself</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={onAddLeadClick}
            className="rounded-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Lead
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onEmailsClick}
            className="rounded-full hover:bg-secondary/50"
            title="Email Campaigns"
          >
            <Mail className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onScheduleClick}
            className="rounded-full hover:bg-secondary/50"
            title="Schedule Meeting"
          >
            <Calendar className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="rounded-full hover:bg-secondary/50"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
