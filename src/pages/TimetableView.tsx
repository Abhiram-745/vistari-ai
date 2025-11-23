import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon, Edit2, Share2, ArrowLeft } from "lucide-react";
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
  const [reflectionSession, setReflectionSession] = useState<{
    date: string;
    index: number;
    session: TimetableSession;
  } | null>(null);
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
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-6 w-6 text-primary" />
                  <h1 className="text-3xl font-bold">{timetable.name}</h1>
                  <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Rename Timetable</DialogTitle>
                        <DialogDescription>
                          Enter a new name for your timetable
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Timetable Name</Label>
                          <Input
                            id="name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter timetable name"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={renameTimetable}>Save</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              <Button onClick={() => setShowShareDialog(true)} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>

            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={progress} className="h-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    {Math.round(progress)}% Complete
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Calendar Filter */}
            <Card>
              <CardHeader>
                <CardTitle>Filter by Date</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => !scheduleDates.some(d => format(d, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd'))}
                    className="rounded-md border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sessions */}
            {filteredDates.map((date) => (
              <Card key={date}>
                <CardHeader>
                  <CardTitle>{format(new Date(date), "EEEE, MMMM d, yyyy")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {timetable.schedule[date].map((session, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        {session.type !== "break" && (
                          <Checkbox
                            checked={session.completed || false}
                            onCheckedChange={() => toggleSessionComplete(date, index)}
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{session.subject} - {session.topic}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.time} • {session.duration} minutes • {session.type}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Study Insights */}
            <StudyInsightsPanel timetableId={timetable.id} />
          </div>
        </main>

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
