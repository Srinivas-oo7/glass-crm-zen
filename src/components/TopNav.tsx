import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface TopNavProps {
  onSettingsClick: () => void;
}

const TopNav = ({ onSettingsClick }: TopNavProps) => {
  return (
    <nav className="glass-tile sticky top-4 mx-4 mb-6 z-50">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Zero-Click CRM</h1>
          <p className="text-sm text-muted-foreground">Your CRM that fills itself</p>
        </div>
        
        <div className="flex items-center gap-3">
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
