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

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
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
                AI assistant powered by Gemini 2.5 Flash
              </p>
              <Button variant="outline" className="rounded-xl">
                Configure AI Settings
              </Button>
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
