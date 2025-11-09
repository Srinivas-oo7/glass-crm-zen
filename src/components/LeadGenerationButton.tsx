import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const LeadGenerationButton = () => {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('lead-generation-agent');

      if (error) throw error;

      toast.success(`Found ${data.leadsInserted} new leads!`);
      console.log('Leads generated:', data);
    } catch (error: any) {
      console.error('Lead generation failed:', error);
      toast.error(error.message || "Failed to generate leads");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleGenerate} 
      disabled={loading}
      variant="default"
      size="sm"
      className="gap-2"
    >
      <Zap className="h-4 w-4" />
      {loading ? "Finding Leads..." : "Find New Leads"}
    </Button>
  );
};

export default LeadGenerationButton;