import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ProfileDiscoveryButton = () => {
  const [loading, setLoading] = useState(false);

  const handleDiscovery = async () => {
    setLoading(true);
    try {
      const userEmail = "manager@innotech.ai"; // You can make this dynamic
      
      const { data, error } = await supabase.functions.invoke('profile-discovery', {
        body: { userEmail }
      });

      if (error) throw error;

      toast.success("Company profile discovered and saved!");
      console.log('Profile:', data.profile);
    } catch (error: any) {
      console.error('Profile discovery failed:', error);
      toast.error(error.message || "Failed to discover company profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleDiscovery} 
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Sparkles className="h-4 w-4" />
      {loading ? "Discovering..." : "Discover Company Profile"}
    </Button>
  );
};

export default ProfileDiscoveryButton;