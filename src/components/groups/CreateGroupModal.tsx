import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateGroupModal = ({ open, onOpenChange, onSuccess }: CreateGroupModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [maxMembers, setMaxMembers] = useState(10);
  const [loading, setLoading] = useState(false);

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const joinCode = isPrivate ? generateJoinCode() : null;

      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .insert({
          name,
          description,
          subject: subject || null,
          is_private: isPrivate,
          join_code: joinCode,
          max_members: maxMembers,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      toast.success(
        isPrivate
          ? `Group created! Join code: ${joinCode}`
          : "Group created successfully!",
        { duration: 5000 }
      );

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setName("");
      setDescription("");
      setSubject("");
      setIsPrivate(false);
      setMaxMembers(10);
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error("Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Study Group</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Group Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., GCSE Maths Study Squad"
            />
          </div>

          <div>
            <Label htmlFor="subject">Subject (Optional)</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Mathematics"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="private">Private Group</Label>
              <p className="text-xs text-muted-foreground">
                Requires join code to enter
              </p>
            </div>
            <Switch
              id="private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>

          <div>
            <Label htmlFor="maxMembers">Max Members</Label>
            <Input
              id="maxMembers"
              type="number"
              min={2}
              max={50}
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value))}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Creating..." : "Create Group"}
            </Button>
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
