import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Edit2, Users, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { TimetableEditDialog } from "@/components/TimetableEditDialog";
import { SessionResourceDialog } from "@/components/SessionResourceDialog";
import { TopicResourcesPanel } from "@/components/TopicResourcesPanel";
import { TopicReflectionDialog } from "@/components/TopicReflectionDialog";
import { StudyInsightsPanel } from "@/components/StudyInsightsPanel";
import { ShareTimetableDialog } from "@/components/ShareTimetableDialog";
import { DailyInsightsPanel } from "@/components/DailyInsightsPanel";

interface TimetableSession {
  time: string;
  duration: number;
  subject: string;
  topic: string;
  type: string;
  notes?: string;
  testDate?: string;
  homeworkDueDate?: string;
  completed?: boolean;
}

interface TimetableSchedule {
  [date: string]: TimetableSession[];
}

interface Timetable {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  schedule: TimetableSchedule;
  subjects?: any[];
  topics?: any[];
  test_dates?: any[];
  preferences?: any;
}

const TimetableView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedSession, setSelectedSession] = useState<{
    date: string;
    index: number;
    session: TimetableSession;
  } | null>(null);
  const [reflectionSession, setReflectionSession] = useState<{
    date: string;
    index: number;
    session: TimetableSession;
  } | null>(null);
  const [resourcesRefreshKey, setResourcesRefreshKey] = useState(0);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTimetable();
    }
  }, [id]);

  const fetchTimetable = async () => {
    const { data, error } = await supabase
      .from("timetables")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Failed to load timetable");
      navigate("/");
    } else {
      setTimetable(data as unknown as Timetable);
      setNewName(data.name);
    }
    setLoading(false);
  };

  const renameTimetable = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a valid name");
      return;
    }

    const { error } = await supabase
      .from("timetables")
      .update({ name: newName.trim() })
      .eq("id", id);

    if (error) {
      toast.error("Failed to rename timetable");
    } else {
      setTimetable({ ...timetable!, name: newName.trim() });
      setIsRenameDialogOpen(false);
      toast.success("Timetable renamed!");
    }
  };

  const toggleSessionComplete = async (date: string, sessionIndex: number) => {
    if (!timetable) return;

    const updatedSchedule = { ...timetable.schedule };
    const session = updatedSchedule[date][sessionIndex];
    session.completed = !session.completed;

    const { error } = await supabase
      .from("timetables")
      .update({ schedule: updatedSchedule as any })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update progress");
    } else {
      setTimetable({ ...timetable, schedule: updatedSchedule });
      
      // Update study streak when marking complete
      if (session.completed && session.type !== "break") {
        await updateStudyStreak(date, session.duration);
        // Open reflection dialog for study sessions
        if (session.type === "study") {
          setReflectionSession({ date, index: sessionIndex, session });
        } else {
          toast.success("Session marked as complete!");
        }
      } else {
        toast.success("Session marked as incomplete");
      }
    }
  };

  const updateStudyStreak = async (date: string, duration: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if streak record exists for this date
    const { data: existing } = await supabase
      .from("study_streaks")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", date)
      .maybeSingle();

    if (existing) {
      // Update existing record
      await supabase
        .from("study_streaks")
        .update({
          sessions_completed: existing.sessions_completed + 1,
          minutes_studied: existing.minutes_studied + duration,
        })
        .eq("id", existing.id);
    } else {
      // Create new record
      await supabase
        .from("study_streaks")
        .insert({
          user_id: user.id,
          date: date,
          sessions_completed: 1,
          minutes_studied: duration,
        });
    }
  };

  const calculateProgress = () => {
    if (!timetable) return 0;
    
    let total = 0;
    let completed = 0;
    
    Object.values(timetable.schedule).forEach((sessions) => {
      sessions.forEach((session) => {
        if (session.type !== "break") {
          total++;
          if (session.completed) completed++;
        }
      });
    });
    
    return total > 0 ? (completed / total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading timetable...</div>
      </div>
    );
  }

  if (!timetable) {
    return null;
  }

  const sortedDates = Object.keys(timetable.schedule).sort();
  const progress = calculateProgress();

  const scheduleDates = sortedDates.map(date => new Date(date));
  const filteredDates = selectedDate
    ? sortedDates.filter(date => {
        const dateObj = new Date(date);
        return format(dateObj, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      })
    : sortedDates;

  return (
    <>
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen w-full bg-gradient-to-br from-background via-muted/50 to-background">
        <Header />
        
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-16 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
...
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
...
        </main>

        {selectedSession && (
          <SessionResourceDialog
            open={!!selectedSession}
            onOpenChange={(open) => !open && setSelectedSession(null)}
            timetableId={timetable.id}
            sessionId={`${selectedSession.date}_${selectedSession.index}`}
            subject={selectedSession.session.subject}
            topic={selectedSession.session.topic}
            onResourceAdded={() => setResourcesRefreshKey(prev => prev + 1)}
          />
        )}

        {selectedSession && (
          <TimetableEditDialog
            open={!!selectedSession}
            onOpenChange={(open) => !open && setSelectedSession(null)}
            session={selectedSession.session}
            date={selectedSession.date}
            onSave={handleUpdateSession}
          />
        )}

        {reflectionSession && (
          <TopicReflectionDialog
            open={!!reflectionSession}
            onOpenChange={(open) => {
              if (!open) {
                setReflectionSession(null);
                toast.success("Session marked as complete!");
              }
            }}
            timetableId={timetable.id}
            sessionDate={reflectionSession.date}
            sessionIndex={reflectionSession.index}
            subject={reflectionSession.session.subject}
            topic={reflectionSession.session.topic}
          />
        )}
        
        {timetable && (
          <ShareTimetableDialog
            open={showShareDialog}
            onOpenChange={setShowShareDialog}
            timetableId={timetable.id}
            timetableName={timetable.name}
          />
        )}
      </div>
    </>
  );
};

export default TimetableView;
