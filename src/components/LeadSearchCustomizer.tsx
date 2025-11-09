import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings, Target, Building, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CompanyProfile {
  id: string;
  company: string;
  industry: string;
  target_industries: string[];
  target_roles: string[];
  keywords: string[];
}

// Safely coerce arbitrary JSON to string[]
const toStrArray = (val: any): string[] => {
  if (Array.isArray(val)) return val.map((v) => String(v));
  if (typeof val === 'string') return [val];
  return [];
};

interface LeadSearchCustomizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LeadSearchCustomizer = ({ open, onOpenChange }: LeadSearchCustomizerProps) => {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetIndustries, setTargetIndustries] = useState<string[]>([]);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newTargetIndustry, setNewTargetIndustry] = useState("");
  const [newTargetRole, setNewTargetRole] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchProfile();
    }
  }, [open]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('company_profile')
      .select('*')
      .limit(1)
      .single();

    if (data) {
      const coerced: CompanyProfile = {
        id: data.id,
        company: data.company,
        industry: (data.industry as string) || "",
        target_industries: toStrArray(data.target_industries),
        target_roles: toStrArray(data.target_roles),
        keywords: toStrArray(data.keywords),
      };
      setProfile(coerced);
      setCompany(coerced.company);
      setIndustry(coerced.industry);
      setTargetIndustries(coerced.target_industries);
      setTargetRoles(coerced.target_roles);
      setKeywords(coerced.keywords);
    } else {
      // Set defaults
      setCompany("InnoTech AI");
      setIndustry("Artificial Intelligence");
      setTargetIndustries(["SaaS", "Technology", "Startups"]);
      setTargetRoles(["Sales Manager", "Head of Sales", "VP Sales"]);
      setKeywords(["CRM", "sales automation", "lead generation"]);
    }
  };

  const addToArray = (value: string, array: string[], setter: (arr: string[]) => void, clearSetter: (val: string) => void) => {
    if (value.trim() && !array.includes(value.trim())) {
      setter([...array, value.trim()]);
      clearSetter("");
    }
  };

  const removeFromArray = (value: string, array: string[], setter: (arr: string[]) => void) => {
    setter(array.filter(item => item !== value));
  };

  const handleSave = async () => {
    try {
      const profileData = {
        company,
        industry,
        target_industries: targetIndustries,
        target_roles: targetRoles,
        keywords: keywords,
      };

      if (profile) {
        await supabase
          .from('company_profile')
          .update(profileData)
          .eq('id', profile.id);
      } else {
        await supabase
          .from('company_profile')
          .insert(profileData);
      }

      toast({
        title: "Profile Updated",
        description: "Your lead search preferences have been saved.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save profile.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Lead Search</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium">Company Name</label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Your company name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Industry</label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="Your industry (e.g., SaaS, AI, Healthcare)"
            />
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Target Industries
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTargetIndustry}
                onChange={(e) => setNewTargetIndustry(e.target.value)}
                placeholder="Add target industry"
                onKeyPress={(e) => e.key === 'Enter' && addToArray(newTargetIndustry, targetIndustries, setTargetIndustries, setNewTargetIndustry)}
              />
              <Button 
                onClick={() => addToArray(newTargetIndustry, targetIndustries, setTargetIndustries, setNewTargetIndustry)}
                size="sm"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {targetIndustries.map((industry) => (
                <Badge key={industry} variant="secondary" className="cursor-pointer" onClick={() => removeFromArray(industry, targetIndustries, setTargetIndustries)}>
                  {industry} ×
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Target Roles
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newTargetRole}
                onChange={(e) => setNewTargetRole(e.target.value)}
                placeholder="Add target role"
                onKeyPress={(e) => e.key === 'Enter' && addToArray(newTargetRole, targetRoles, setTargetRoles, setNewTargetRole)}
              />
              <Button 
                onClick={() => addToArray(newTargetRole, targetRoles, setTargetRoles, setNewTargetRole)}
                size="sm"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {targetRoles.map((role) => (
                <Badge key={role} variant="secondary" className="cursor-pointer" onClick={() => removeFromArray(role, targetRoles, setTargetRoles)}>
                  {role} ×
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Keywords
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword"
                onKeyPress={(e) => e.key === 'Enter' && addToArray(newKeyword, keywords, setKeywords, setNewKeyword)}
              />
              <Button 
                onClick={() => addToArray(newKeyword, keywords, setKeywords, setNewKeyword)}
                size="sm"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeFromArray(keyword, keywords, setKeywords)}>
                  {keyword} ×
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">
              Save Profile
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { LeadSearchCustomizer };