import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface DailyInsightsPanelProps {
  date: string;
  sessions: Array<{
    time: string;
    duration: number;
    subject: string;
    topic: string;
    type: string;
    completed?: boolean;
  }>;
  timetableId: string;
  onScheduleUpdate: () => void;
}

export const DailyInsightsPanel = ({
  date,
  sessions,
  timetableId,
  onScheduleUpdate,
}: DailyInsightsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reflection, setReflection] = useState("");
  const [completedSessions, setCompletedSessions] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [dailyReflectionId, setDailyReflectionId] = useState<string | null>(null);

  // Load existing reflection for this date
  useEffect(() => {
    loadDailyReflection();
  }, [date, timetableId]);

  const loadDailyReflection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("topic_reflections")
        .select("*")
        .eq("timetable_id", timetableId)
        .eq("session_date", date)
        .eq("session_index", -1) // Use -1 for daily reflections
        .maybeSingle();

      if (data) {
        setDailyReflectionId(data.id);
        const reflectionData = data.reflection_data as any;
        setReflection(reflectionData?.dailyReflection || "");
        setCompletedSessions(reflectionData?.completedSessions || []);
      }
    } catch (error) {
      console.error("Error loading daily reflection:", error);
    }
  };

  const saveDailyReflection = async (reflectionText: string, completed: number[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const reflectionData = {
        dailyReflection: reflectionText,
        completedSessions: completed,
      };

      if (dailyReflectionId) {
        // Update existing reflection
        await supabase
          .from("topic_reflections")
          .update({
            reflection_data: reflectionData,
            updated_at: new Date().toISOString(),
          })
          .eq("id", dailyReflectionId);
      } else {
        // Create new reflection
        const { data } = await supabase
          .from("topic_reflections")
          .insert({
            user_id: user.id,
            timetable_id: timetableId,
            session_date: date,
            session_index: -1, // Use -1 for daily reflections
            subject: "Daily",
            topic: "Daily Reflection",
            reflection_data: reflectionData,
          })
          .select()
          .single();

        if (data) {
          setDailyReflectionId(data.id);
        }
      }
    } catch (error) {
      console.error("Error saving daily reflection:", error);
    }
  };

  const handleSessionToggle = (index: number) => {
    const newCompleted = completedSessions.includes(index)
      ? completedSessions.filter((i) => i !== index)
      : [...completedSessions, index];
    
    setCompletedSessions(newCompleted);
    saveDailyReflection(reflection, newCompleted);
  };

  const handleReflectionChange = (text: string) => {
    setReflection(text);
    saveDailyReflection(text, completedSessions);
  };

  const handleGenerateNextDay = async () => {
    if (!reflection.trim() && completedSessions.length === 0) {
      toast.error("Please add your reflection or mark completed sessions");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get incomplete sessions
      const incompleteSessions = sessions
        .filter((_, idx) => !completedSessions.includes(idx))
        .filter((s) => s.type !== "break");

      const { data, error } = await supabase.functions.invoke("adjust-schedule", {
        body: {
          timetableId,
          currentDate: date,
          reflection,
          completedSessionIndices: completedSessions,
          incompleteSessions: incompleteSessions.map((s) => ({
            subject: s.subject,
            topic: s.topic,
            duration: s.duration,
            type: s.type,
          })),
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Schedule updated! Missed topics added to next available days");
      onScheduleUpdate();
      
      // Don't clear the reflection and completed sessions
      // Users can still see what they wrote
    } catch (error: any) {
      console.error("Error adjusting schedule:", error);
      toast.error(error.message || "Failed to update schedule");
    } finally {
      setLoading(false);
    }
  };

  const completedCount = completedSessions.length;
  const totalSessions = sessions.filter((s) => s.type !== "break").length;

  return (
    <Card className="mt-4 border-primary/20 bg-gradient-to-r from-primary/5 to-background">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Insights on the Day
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {completedCount}/{totalSessions} completed
            </Badge>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Session Checklist */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Mark completed sessions:</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessions
                .filter((s) => s.type !== "break")
                .map((session, idx) => {
                  const actualIndex = sessions.findIndex(
                    (s) => s === session
                  );
                  return (
                    <div
                      key={actualIndex}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        checked={completedSessions.includes(actualIndex)}
                        onCheckedChange={() => handleSessionToggle(actualIndex)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {session.subject}: {session.topic}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.time} • {session.duration} mins
                        </p>
                      </div>
                      {completedSessions.includes(actualIndex) ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Reflection Text */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Daily Reflection:</h4>
            <Textarea
              value={reflection}
              onChange={(e) => handleReflectionChange(e.target.value)}
              placeholder="How did today go? What challenges did you face? What worked well? Any topics you need more time on?"
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Stats */}
          {completedSessions.length < totalSessions && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {totalSessions - completedSessions.length} session(s) will be
                rescheduled to upcoming days
              </p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerateNextDay}
            disabled={loading || (completedSessions.length === 0 && !reflection.trim())}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adjusting Schedule...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Update Schedule Based on Progress
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            AI will reschedule incomplete topics to the next available slots
          </p>
        </CardContent>
      )}
    </Card>
  );
};
