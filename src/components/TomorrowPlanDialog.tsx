import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface TomorrowPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timetableId: string;
  currentDate: string;
  reflection: string;
  incompleteSessions: Array<{
    subject: string;
    topic: string;
    duration: number;
    type: string;
  }>;
  onScheduleUpdate: () => void;
}

export const TomorrowPlanDialog = ({
  open,
  onOpenChange,
  timetableId,
  currentDate,
  reflection,
  incompleteSessions,
  onScheduleUpdate,
}: TomorrowPlanDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [availableTopics, setAvailableTopics] = useState<Array<{ subject: string; topic: string }>>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [useFlexibleTiming, setUseFlexibleTiming] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [hasFlexiblePreference, setHasFlexiblePreference] = useState(false);

  // Calculate tomorrow's date
  const tomorrow = new Date(currentDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];
  const tomorrowDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  useEffect(() => {
    if (open) {
      loadAvailableTopics();
      checkTimingPreferences();
    }
  }, [open, timetableId]);

  const checkTimingPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: preferences } = await supabase
        .from('study_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (preferences) {
        const dayTimeSlots = preferences.day_time_slots as any[] || [];
        const hasFlexible = dayTimeSlots.some(slot => !slot.enabled || slot.startTime !== slot.endTime);
        setHasFlexiblePreference(hasFlexible);
        
        // Set default times from preferences
        const tomorrowDayOfWeek = tomorrow.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const tomorrowSlot = dayTimeSlots.find(slot => slot.day === tomorrowDayOfWeek);
        
        if (tomorrowSlot) {
          setStartTime(tomorrowSlot.startTime || '09:00');
          setEndTime(tomorrowSlot.endTime || '17:00');
        }
      }
    } catch (error) {
      console.error('Error checking timing preferences:', error);
    }
  };

  const loadAvailableTopics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: timetable } = await supabase
        .from('timetables')
        .select('topics, subjects')
        .eq('id', timetableId)
        .single();

      if (timetable) {
        const topics = (timetable.topics as any[]) || [];
        const subjects = (timetable.subjects as any[]) || [];
        
        const topicsWithSubjects = topics.map(topic => {
          const subject = subjects.find(s => s.id === topic.subject_id);
          return {
            subject: subject?.name || 'Unknown',
            topic: topic.name
          };
        });

        setAvailableTopics(topicsWithSubjects);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      toast.error('Failed to load topics');
    }
  };

  const handleTopicToggle = (topicKey: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicKey)
        ? prev.filter(t => t !== topicKey)
        : [...prev, topicKey]
    );
  };

  const handleGenerateTomorrow = async () => {
    if (selectedTopics.length === 0 && incompleteSessions.length === 0) {
      toast.error('Please select at least one topic or have incomplete sessions to reschedule');
      return;
    }

    setLoading(true);
    try {
      const selectedTopicObjects = selectedTopics.map(key => {
        const [subject, topic] = key.split('|||');
        return { subject, topic };
      });

      const { data, error } = await supabase.functions.invoke('regenerate-tomorrow', {
        body: {
          timetableId,
          currentDate,
          tomorrowDate,
          reflection,
          selectedTopics: selectedTopicObjects,
          incompleteSessions,
          ...(useFlexibleTiming && { startTime, endTime })
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.summary) {
        toast.success(data.summary, { duration: 8000 });
      } else {
        toast.success('Tomorrow\'s schedule generated successfully!');
      }

      onScheduleUpdate();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error generating tomorrow:', error);
      toast.error(error.message || 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Plan Tomorrow's Schedule
          </DialogTitle>
          <DialogDescription>
            Customize your schedule for {tomorrowDay}. Select topics to focus on and we'll generate an optimized schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Topic Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Select Topics for Tomorrow</Label>
              <Badge variant="secondary">{selectedTopics.length} selected</Badge>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
              {availableTopics.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No topics available. Topics from your timetable will appear here.
                </p>
              ) : (
                availableTopics.map((topic, idx) => {
                  const topicKey = `${topic.subject}|||${topic.topic}`;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedTopics.includes(topicKey)}
                        onCheckedChange={() => handleTopicToggle(topicKey)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{topic.subject}</p>
                        <p className="text-xs text-muted-foreground">{topic.topic}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Incomplete Sessions Info */}
          {incompleteSessions.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                {incompleteSessions.length} incomplete session(s) from today will be considered for rescheduling based on your reflection.
              </p>
            </div>
          )}

          {/* Flexible Timing */}
          {hasFlexiblePreference && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={useFlexibleTiming}
                  onCheckedChange={(checked) => setUseFlexibleTiming(checked as boolean)}
                />
                <Label className="text-sm font-medium cursor-pointer">
                  Customize tomorrow's timing
                </Label>
              </div>

              {useFlexibleTiming && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="start-time" className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Start Time
                    </Label>
                    <Input
                      id="start-time"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-time" className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      End Time
                    </Label>
                    <Input
                      id="end-time"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleGenerateTomorrow}
              disabled={loading || (selectedTopics.length === 0 && incompleteSessions.length === 0)}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating Schedule...
                </>
              ) : (
                'Generate Tomorrow\'s Schedule'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            AI will create a balanced schedule considering your selected topics, reflection, events, and time preferences
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
