import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useEffect, useState } from "react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const [backgroundImage, setBackgroundImage] = useState<string>("");

  useEffect(() => {
    const savedBg = localStorage.getItem('crm-background');
    if (savedBg) setBackgroundImage(savedBg);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBackgroundImage(result);
        localStorage.setItem('crm-background', result);
        window.dispatchEvent(new Event('background-changed'));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackground = () => {
    setBackgroundImage("");
    localStorage.removeItem('crm-background');
    window.dispatchEvent(new Event('background-changed'));
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-tile max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your CRM preferences and integrations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Background Image</Label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl flex-1"
                  onClick={() => document.getElementById('bg-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
                {backgroundImage && (
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={removeBackground}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <input
                id="bg-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              {backgroundImage && (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
                  <img
                    src={backgroundImage}
                    alt="Background preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="company">Company Name</Label>
            <Input id="company" placeholder="Your Company" className="rounded-xl" />
          </div>

          <div className="space-y-3">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" className="rounded-xl" />
          </div>

          <div className="space-y-3">
            <Label>AI Model Settings</Label>
            <div className="p-4 bg-muted/50 rounded-xl space-y-2">
              <p className="text-sm text-muted-foreground">
                AI assistant powered by Google Gemini 2.0 Flash
              </p>
              <p className="text-xs text-muted-foreground">
                Connected via your Gemini API key
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Data & Privacy</Label>
            <div className="p-4 bg-muted/50 rounded-xl space-y-2">
              <p className="text-sm text-muted-foreground">
                Your data is encrypted and secure
              </p>
              <Button variant="outline" className="rounded-xl">
                Export Data
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)} className="rounded-xl">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
