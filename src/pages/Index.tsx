import { useState } from "react";
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

  return (
    <div className="min-h-screen pb-6">
      <TopNav onSettingsClick={() => setSettingsOpen(true)} />
      
      <main className="px-4 max-w-[1800px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-[calc(100vh-140px)]">
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
  );
};

export default Index;
