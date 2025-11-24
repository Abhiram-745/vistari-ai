import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { toast } from "sonner";

interface DashboardSection {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const DEFAULT_SECTIONS: DashboardSection[] = [
  { id: "progress", label: "Progress Tracking", description: "Study streak, weekly goals, and deadlines", enabled: true },
  { id: "events", label: "Events & Commitments", description: "Your schedule at a glance", enabled: true },
  { id: "analytics", label: "AI Analytics", description: "Insights and performance analysis", enabled: true },
  { id: "timetables", label: "Timetables", description: "Your study plans", enabled: true },
  { id: "homework", label: "Active Homework", description: "Homework tracker", enabled: true },
];

interface DashboardCustomizerProps {
  onSettingsChange: (sections: Record<string, boolean>) => void;
}

export const DashboardCustomizer = ({ onSettingsChange }: DashboardCustomizerProps) => {
  const [sections, setSections] = useState<DashboardSection[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const saved = localStorage.getItem("dashboardSections");
    if (saved) {
      try {
        const savedSections = JSON.parse(saved);
        setSections(savedSections);
        const settings = savedSections.reduce((acc: Record<string, boolean>, section: DashboardSection) => {
          acc[section.id] = section.enabled;
          return acc;
        }, {});
        onSettingsChange(settings);
      } catch {
        setSections(DEFAULT_SECTIONS);
      }
    } else {
      setSections(DEFAULT_SECTIONS);
    }
  }, []);

  const handleToggle = (id: string) => {
    const updated = sections.map(section =>
      section.id === id ? { ...section, enabled: !section.enabled } : section
    );
    setSections(updated);
    localStorage.setItem("dashboardSections", JSON.stringify(updated));
    
    const settings = updated.reduce((acc: Record<string, boolean>, section) => {
      acc[section.id] = section.enabled;
      return acc;
    }, {});
    onSettingsChange(settings);
    toast.success("Dashboard updated");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Customize Dashboard
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Choose which sections to display on your dashboard
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {sections.map((section) => (
            <div key={section.id} className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex-1 space-y-1">
                <Label htmlFor={section.id} className="text-base font-medium cursor-pointer">
                  {section.label}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
              <Switch
                id={section.id}
                checked={section.enabled}
                onCheckedChange={() => handleToggle(section.id)}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
