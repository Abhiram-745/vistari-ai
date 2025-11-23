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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <Header />
      
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">{timetable.name}</h1>
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
                  <div className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="name">Timetable Name</Label>
                      <Input
                        id="name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="e.g. Spring Revision Plan"
                        maxLength={100}
                      />
                    </div>
                    <Button onClick={renameTimetable} className="w-full">
                      Save Changes
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              {timetable.subjects && timetable.topics && timetable.test_dates && timetable.preferences && (
                <TimetableEditDialog
                  timetableId={timetable.id}
                  currentSubjects={timetable.subjects}
                  currentTopics={timetable.topics}
                  currentTestDates={timetable.test_dates}
                  currentPreferences={timetable.preferences}
                  startDate={timetable.start_date}
                  endDate={timetable.end_date}
                  onUpdate={fetchTimetable}
                />
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              className="gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share to Group
            </Button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 space-y-4">
          <p className="text-muted-foreground">
            {format(new Date(timetable.start_date), "dd/MM/yyyy")} - {format(new Date(timetable.end_date), "dd/MM/yyyy")}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Tasks */}
          <div className="flex-1 space-y-6">
            {selectedDate && (
              <div className="mb-4">
                <Button variant="outline" onClick={() => setSelectedDate(undefined)}>
                  Show All Days
                </Button>
              </div>
            )}
            
            {filteredDates.map((date) => {
            const sessions = timetable.schedule[date];
            const dateObj = new Date(date);
            
            return (
              <Card key={date} className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    {format(dateObj, "EEEE, dd/MM/yyyy")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessions && sessions.length > 0 ? (
                      sessions.map((session, idx) => (
                        <div
                          key={idx}
                          onClick={() =>
                            session.type !== "break" &&
                            setSelectedSession({ date, index: idx, session })
                          }
                          className={`p-4 rounded-lg border-l-4 ${
                            session.completed
                              ? "bg-primary/10 border-primary opacity-60"
                              : session.type === "break"
                              ? "bg-muted/30 border-muted-foreground"
                              : session.type === "homework"
                              ? "bg-purple-50 dark:bg-purple-950/20 border-purple-500"
                              : session.type === "revision"
                              ? "bg-blue-50 dark:bg-blue-950/20 border-blue-500"
                              : session.testDate
                              ? "bg-orange-50 dark:bg-orange-950/20 border-orange-500"
                              : "bg-primary/5 border-primary"
                          } ${
                            session.type !== "break"
                              ? "cursor-pointer hover:shadow-md transition-shadow"
                              : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm">
                                  {session.time}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({session.duration} min)
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    session.type === "break"
                                      ? "bg-muted text-muted-foreground"
                                      : session.type === "homework"
                                      ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                                      : session.type === "revision"
                                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                      : "bg-primary/10 text-primary"
                                  }`}
                                >
                                  {session.type}
                                </span>
                              </div>
                              {session.subject && (
                                <p className="font-medium">{session.subject}</p>
                              )}
                              {session.topic && (
                                <p className="text-sm text-muted-foreground">
                                  {session.topic}
                                </p>
                              )}
                              {session.testDate && (
                                <p className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-1">
                                  📝 Test: {format(new Date(session.testDate), "dd/MM/yyyy")}
                                </p>
                              )}
                              {session.homeworkDueDate && (
                                <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mt-1">
                                  📚 Due: {format(new Date(session.homeworkDueDate), "dd/MM/yyyy")}
                                </p>
                              )}
                              {session.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {session.notes}
                                </p>
                              )}
                            </div>
                            {session.type !== "break" && (
                              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={session.completed || false}
                                  onCheckedChange={() => toggleSessionComplete(date, idx)}
                                  className="h-5 w-5"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        No sessions scheduled for this day
                      </p>
                     )}
                   </div>

                   {/* Daily Insights Panel */}
                   <DailyInsightsPanel
                     date={date}
                     sessions={sessions || []}
                     timetableId={timetable.id}
                     onScheduleUpdate={fetchTimetable}
                   />
                 </CardContent>
               </Card>
             );
           })}
          </div>

          {/* Right side - Calendar and Topics */}
          <div className="lg:w-96 space-y-6">
            <div className="lg:sticky lg:top-24 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select a Date</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{
                      hasSession: scheduleDates,
                    }}
                    modifiersClassNames={{
                      hasSession: "bg-primary/20 font-bold",
                    }}
                    disabled={(date) => {
                      const dateStr = format(date, 'yyyy-MM-dd');
                      return !sortedDates.includes(dateStr);
                    }}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <TopicResourcesPanel
                key={resourcesRefreshKey}
                timetableId={timetable.id}
                schedule={timetable.schedule}
              />

              <StudyInsightsPanel timetableId={timetable.id} />
            </div>
          </div>
        </div>
      </main>

      {selectedSession && (
        <SessionResourceDialog
          open={!!selectedSession}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSession(null);
              setResourcesRefreshKey(prev => prev + 1);
            }
          }}
          timetableId={timetable.id}
          sessionId={`${selectedSession.date}-${selectedSession.index}`}
          sessionDetails={{
            subject: selectedSession.session.subject,
            topic: selectedSession.session.topic,
            date: format(new Date(selectedSession.date), "EEEE, dd/MM/yyyy"),
            time: selectedSession.session.time,
          }}
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
  );
};

export default TimetableView;
