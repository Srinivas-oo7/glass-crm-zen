import { useState, useEffect } from "react";
import TopNav from "@/components/TopNav";
import DashboardTile from "@/components/tiles/DashboardTile";
import ContactsTile from "@/components/tiles/ContactsTile";
import DealsTile from "@/components/tiles/DealsTile";
import FollowUpsTile from "@/components/tiles/FollowUpsTile";
import CalendarTile from "@/components/tiles/CalendarTile";
import TodaysTasksTile from "@/components/tiles/TodaysTasksTile";
import AIAssistant from "@/components/AIAssistant";
import SettingsModal from "@/components/SettingsModal";

const Index = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>("");

  useEffect(() => {
    const loadBackground = () => {
      const savedBg = localStorage.getItem('crm-background');
      if (savedBg) setBackgroundImage(savedBg);
    };

    loadBackground();
    window.addEventListener('background-changed', loadBackground);
    return () => window.removeEventListener('background-changed', loadBackground);
  }, []);

  return (
    <div 
      className="h-screen overflow-hidden flex flex-col pb-6 relative"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {backgroundImage && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      )}
      <div className="relative z-10 h-full flex flex-col">
        <TopNav onSettingsClick={() => setSettingsOpen(true)} />
        
        <main className="flex-1 px-4 max-w-[1800px] mx-auto w-full overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 h-full">
            <div className="lg:col-span-2 lg:row-span-2">
              <DashboardTile />
            </div>
            
            <div className="lg:row-span-2">
              <ContactsTile />
            </div>
            
            <div>
              <DealsTile />
            </div>
            
            <div>
              <FollowUpsTile />
            </div>
            
            <div>
              <TodaysTasksTile />
            </div>
            
            <div>
              <CalendarTile />
            </div>
          </div>
        </main>

        <AIAssistant />
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </div>
  );
};

export default Index;
