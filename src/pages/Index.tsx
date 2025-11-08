import { useState } from "react";
import TopNav from "@/components/TopNav";
import DashboardTile from "@/components/tiles/DashboardTile";
import ContactsTile from "@/components/tiles/ContactsTile";
import DealsTile from "@/components/tiles/DealsTile";
import FollowUpsTile from "@/components/tiles/FollowUpsTile";
import CalendarTile from "@/components/tiles/CalendarTile";
import AIAssistant from "@/components/AIAssistant";
import SettingsModal from "@/components/SettingsModal";

const Index = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen pb-6">
      <TopNav onSettingsClick={() => setSettingsOpen(true)} />
      
      <main className="px-4 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          <div className="lg:col-span-2 min-h-[500px]">
            <DashboardTile />
          </div>
          
          <div className="min-h-[500px]">
            <ContactsTile />
          </div>
          
          <div className="min-h-[500px]">
            <DealsTile />
          </div>
          
          <div className="min-h-[500px]">
            <FollowUpsTile />
          </div>
          
          <div className="min-h-[500px]">
            <CalendarTile />
          </div>
        </div>
      </main>

      <AIAssistant />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;
