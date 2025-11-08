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
    <div className="min-h-screen">
      <TopNav onSettingsClick={() => setSettingsOpen(true)} />
      
      <main className="px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex gap-4">
          {/* Main content area */}
          <div className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <DashboardTile />
              <ContactsTile />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DealsTile />
              <FollowUpsTile />
              <TodaysTasksTile />
            </div>
          </div>

          {/* Widget sidebar */}
          <div className="hidden xl:block w-96">
            <div className="space-y-4 sticky top-4">
              <CalendarTile />
              <div className="widget-card p-4">
                <h3 className="text-sm font-semibold mb-2 text-white/80">Quick Stats</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Total Leads</span>
                    <span className="text-lg font-bold">128</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Active Deals</span>
                    <span className="text-lg font-bold text-green-400">24</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/60">Conv. Rate</span>
                    <span className="text-lg font-bold text-blue-400">32%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AIAssistant />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;
