import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdate?: () => void;
}

const ProfileSettings = ({ open, onOpenChange, onProfileUpdate }: ProfileSettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setEmail(user.email || "");
      
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      
      setFullName(data?.full_name || "");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: fullName });

      if (error) throw error;

      toast.success("Profile updated successfully");
      onProfileUpdate?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <User className="h-5 w-5 text-white" />
            </div>
            Profile Settings
          </DialogTitle>
          <DialogDescription className="text-base">
            Update your profile information and preferences.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-3">
            <Label htmlFor="full-name" className="text-sm font-semibold">Full Name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="h-11 text-base transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="email" className="text-sm font-semibold">Email Address</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-muted/50 h-11 text-base"
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"></span>
              Email address cannot be changed
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-6 hover:bg-muted transition-colors"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading}
            className="px-6 bg-gradient-primary hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileSettings;
