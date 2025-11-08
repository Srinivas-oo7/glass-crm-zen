import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

interface TopNavProps {
  onSettingsClick: () => void;
}

const TopNav = ({ onSettingsClick }: TopNavProps) => {
  return (
    <nav className="backdrop-blur-sm bg-black/10 sticky top-0 z-50 border-b border-white/10">
      <div className="px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Zero-Click CRM</h1>
          <p className="text-sm text-white/60">Powered by AI</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="rounded-full hover:bg-white/10 text-white"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <Avatar className="h-9 w-9 border-2 border-white/20">
            <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
            <AvatarFallback className="bg-white/10 text-white">U</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
