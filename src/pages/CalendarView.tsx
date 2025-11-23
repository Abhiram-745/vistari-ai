import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, BookOpen, CheckCircle2, AlertCircle } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay, parseISO, addMinutes } from "date-fns";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";

interface TimetableSession {
  date: string;
  sessions: {
    subject: string;
    topic: string;
    duration: number;
    startTime: string;
    endTime: string;
    type: string;
    completed?: boolean;
    sessionIndex: number;
  }[];
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  parent_event_id: string | null;
}

interface CalendarItem {
  id: string;
  type: "session" | "event";
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  data: any;
}

const DraggableItem = ({ item }: { item: CalendarItem }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Determine colors based on session type
  const getItemStyles = () => {
    if (item.type === "event") {
      return "bg-red-100 dark:bg-red-950/40 border-red-500 hover:bg-red-200 dark:hover:bg-red-950/60 shadow-md";
    }
    
    // For sessions, check the session type
    const sessionType = item.data?.type;
    
    if (sessionType === "homework") {
      return "bg-purple-100 dark:bg-purple-950/40 border-purple-500 hover:bg-purple-200 dark:hover:bg-purple-950/60";
    } else if (sessionType === "revision") {
      return "bg-blue-100 dark:bg-blue-950/40 border-blue-500 hover:bg-blue-200 dark:hover:bg-blue-950/60";
    } else if (sessionType === "break") {
      return "bg-muted/50 border-muted-foreground/50 hover:bg-muted/70";
    } else if (item.data?.testDate) {
      return "bg-orange-100 dark:bg-orange-950/40 border-orange-500 hover:bg-orange-200 dark:hover:bg-orange-950/60";
    }
    
    return "bg-primary/20 dark:bg-primary/15 border-primary hover:bg-primary/30";
  };

  const getBadgeVariant = () => {
    if (item.type === "event") return "secondary";
    
    const sessionType = item.data?.type;
    if (sessionType === "homework") return "default";
    if (sessionType === "revision") return "default";
    
    return "default";
  };

  const getBadgeText = () => {
    if (item.type === "event") return "Event";
    
    const sessionType = item.data?.type;
    if (sessionType === "homework") return "Homework";
    if (sessionType === "revision") return "Revision";
    if (sessionType === "break") return "Break";
    
    return "Study";
  };

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          className={`p-3 mb-3 rounded-lg border-l-4 cursor-move transition-all hover:shadow-lg ${getItemStyles()}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-semibold leading-tight line-clamp-2 overflow-hidden">{item.title}</p>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <span className="text-xs">🕐</span>
                {item.startTime} - {item.endTime}
              </p>
            </div>
            <Badge 
              variant={getBadgeVariant()} 
              className={`shrink-0 font-medium ${
                item.data?.type === "homework" 
                  ? "bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300" 
                  : item.data?.type === "revision" 
                  ? "bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300"
                  : ""
              }`}
            >
              {getBadgeText()}
            </Badge>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4" side="right" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {item.type === "event" ? "Event Details" : "Session Details"}
            </h4>
            <p className="text-sm font-medium text-foreground">{item.title}</p>
          </div>
          
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-start gap-2 text-xs">
              <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground">Time</p>
                <p className="text-muted-foreground">{item.startTime} - {item.endTime}</p>
              </div>
            </div>
            
            {item.data?.duration && (
              <div className="flex items-start gap-2 text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Duration</p>
                  <p className="text-muted-foreground">{item.data.duration} minutes</p>
                </div>
              </div>
            )}
            
            {item.data?.subject && (
              <div className="flex items-start gap-2 text-xs">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Subject</p>
                  <p className="text-muted-foreground">{item.data.subject}</p>
                </div>
              </div>
            )}
            
            {item.data?.topic && (
              <div className="flex items-start gap-2 text-xs">
                <BookOpen className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Topic</p>
                  <p className="text-muted-foreground">{item.data.topic}</p>
                </div>
              </div>
            )}
            
            {item.data?.completed !== undefined && (
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle2 className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${item.data.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-semibold text-foreground">Status</p>
                  <p className={item.data.completed ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                    {item.data.completed ? 'Completed ✓' : 'Not completed'}
                  </p>
                </div>
              </div>
            )}
            
            {item.data?.notes && (
              <div className="flex items-start gap-2 text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Notes</p>
                  <p className="text-muted-foreground">{item.data.notes}</p>
                </div>
              </div>
            )}
            
            {item.type === "event" && item.data?.description && (
              <div className="flex items-start gap-2 text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Description</p>
                  <p className="text-muted-foreground">{item.data.description}</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="pt-2 border-t">
            <Badge 
              variant={getBadgeVariant()} 
              className={`font-medium ${
                item.data?.type === "homework" 
                  ? "bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200" 
                  : item.data?.type === "revision" 
                  ? "bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  : item.type === "event"
                  ? "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200"
                  : ""
              }`}
            >
              {getBadgeText()}
            </Badge>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

const DroppableDay = ({ date, items, children }: { date: Date; items: CalendarItem[]; children?: React.ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: format(date, "yyyy-MM-dd"),
    data: { date },
  });

  const isToday = isSameDay(date, new Date());
  const dayItems = items.filter((item) => item.date === format(date, "yyyy-MM-dd"));
  
  // Separate events from study sessions for better visualization
  const events = dayItems.filter((item) => item.type === "event");
  const sessions = dayItems.filter((item) => item.type === "session");
  
  // Create time blocks (8 AM to 10 PM)
  const timeBlocks = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8; // Start from 8 AM
    return {
      hour,
      label: `${hour.toString().padStart(2, '0')}:00`,
      isBlocked: events.some(event => {
        const eventStart = parseInt(event.startTime.split(':')[0]);
        const eventEnd = parseInt(event.endTime.split(':')[0]);
        return hour >= eventStart && hour < eventEnd;
      })
    };
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 rounded-xl p-4 min-h-[250px] transition-all relative ${
        isOver 
          ? "bg-primary/10 border-primary shadow-lg scale-[1.02]" 
          : isToday
          ? "bg-primary/5 border-primary/40"
          : "bg-card border-border hover:border-primary/20"
      }`}
    >
      <div className="mb-4 pb-3 border-b-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wide text-foreground">
            {format(date, "EEE")}
          </span>
          <div className={`flex items-center justify-center w-9 h-9 rounded-full font-bold text-base ${
            isToday 
              ? "bg-primary text-primary-foreground shadow-md" 
              : "bg-muted text-muted-foreground"
          }`}>
            {format(date, "d")}
          </div>
        </div>
        {dayItems.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <p className="text-xs text-muted-foreground font-medium">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''}
            </p>
            {events.length > 0 && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <p className="text-xs text-accent font-medium">
                  {events.length} event{events.length !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Time slot indicators - show if there are any items */}
      {dayItems.length > 0 && (
        <div className="mb-3 p-2 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Time Slots</p>
          <div className="grid grid-cols-5 gap-1">
            {timeBlocks.slice(0, 10).map((block) => (
              <div
                key={block.hour}
                title={block.isBlocked ? `${block.label} - Blocked by event` : `${block.label} - Available`}
                className={`h-6 rounded text-[9px] font-medium flex items-center justify-center transition-colors ${
                  block.isBlocked
                    ? "bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-200 border border-red-400 dark:border-red-600"
                    : "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700"
                }`}
              >
                {block.hour}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-450px)]">
        {/* Show events first with special styling */}
        {events.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-xs font-semibold text-accent uppercase tracking-wide sticky top-0 bg-card py-1">
              🚫 Blocked Time Slots
            </p>
            {events
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((item) => (
                <DraggableItem key={item.id} item={item} />
              ))}
          </div>
        )}
        
        {/* Then show study sessions */}
        {sessions.length > 0 && (
          <div className="space-y-2">
            {events.length > 0 && (
              <p className="text-xs font-semibold text-foreground uppercase tracking-wide sticky top-0 bg-card py-1">
                Study Sessions
              </p>
            )}
            {sessions
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((item) => (
                <DraggableItem key={item.id} item={item} />
              ))}
          </div>
        )}
        
        {dayItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-3xl mb-2 opacity-50">📅</div>
            <p className="text-sm text-muted-foreground font-medium">No sessions</p>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

const CalendarView = () => {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [calendarItems, setCalendarItems] = useState<CalendarItem[]>([]);
  const [activeDragItem, setActiveDragItem] = useState<CalendarItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [timetableId, setTimetableId] = useState<string | null>(null);
  const [availableTimetables, setAvailableTimetables] = useState<any[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<string | null>(null);

  useEffect(() => {
    fetchTimetables();
  }, []);

  useEffect(() => {
    if (selectedTimetable) {
      fetchCalendarData();
    }
  }, [currentWeek, selectedTimetable]);

  const fetchTimetables = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: timetables, error } = await supabase
        .from("timetables")
        .select("id, name, start_date, end_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setAvailableTimetables(timetables || []);
      
      // Auto-select first timetable if available
      if (timetables && timetables.length > 0) {
        setSelectedTimetable(timetables[0].id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching timetables:", error);
      toast.error("Failed to load timetables");
      setLoading(false);
    }
  };

  const fetchCalendarData = async () => {
    if (!selectedTimetable) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const weekStart = format(currentWeek, "yyyy-MM-dd");
      const weekEnd = format(addDays(currentWeek, 6), "yyyy-MM-dd");

      console.log("Fetching calendar data for:", { selectedTimetable, weekStart, weekEnd });

      // Fetch the selected timetable
      const { data: timetable, error: timetableError } = await supabase
        .from("timetables")
        .select("*")
        .eq("id", selectedTimetable)
        .single();

      if (timetableError) {
        console.error("Timetable error:", timetableError);
        throw timetableError;
      }

      console.log("Timetable data:", timetable);

      // Fetch events for the current week
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .gte("start_time", weekStart)
        .lte("start_time", weekEnd + "T23:59:59")
        .order("start_time", { ascending: true });

      if (eventsError) {
        console.error("Events error:", eventsError);
        throw eventsError;
      }

      console.log("Events data:", events);

      const items: CalendarItem[] = [];

      // Process timetable sessions
      if (timetable && timetable.schedule) {
        setTimetableId(timetable.id);
        
        const schedule = timetable.schedule as Record<string, any[]>;
        console.log("Schedule keys:", Object.keys(schedule || {}));
        
        if (schedule && typeof schedule === "object") {
          Object.entries(schedule).forEach(([date, sessions]) => {
            if (!Array.isArray(sessions)) {
              console.warn("Sessions value is not array for date", date, sessions);
              return;
            }

            const scheduleDate = parseISO(date);
            const weekStartDate = currentWeek;
            const weekEndDate = addDays(currentWeek, 6);

            if (scheduleDate >= weekStartDate && scheduleDate <= weekEndDate) {
              sessions.forEach((session: any, index: number) => {
                const startTimeStr: string = session.time || session.startTime || "09:00";
                const [hours, minutes] = startTimeStr.split(":").map(Number);
                const startDateTime = new Date(`${date}T${startTimeStr}:00`);
                const endDateTime = addMinutes(startDateTime, session.duration || 60);

              const item: CalendarItem = {
                id: `session-${date}-${index}`,
                type: "session",
                title: session.subject ? `${session.subject}${session.topic ? `: ${session.topic}` : ""}` : session.topic || "Study session",
                date,
                startTime: format(startDateTime, "HH:mm"),
                endTime: format(endDateTime, "HH:mm"),
                color: "primary",
                data: { 
                  ...session,
                  sessionIndex: index, 
                  date,
                  type: session.type || "study" // Preserve the session type
                },
              };

                items.push(item);
              });
            }
          });
        } else {
          console.error("Schedule is not an object:", schedule);
        }
      }

      // Process events
      if (events && events.length > 0) {
        console.log(`Processing ${events.length} events`);
        
        events.forEach((event) => {
          const eventDate = format(parseISO(event.start_time), "yyyy-MM-dd");
          const startTime = format(parseISO(event.start_time), "HH:mm");
          const endTime = format(parseISO(event.end_time), "HH:mm");

          const item = {
            id: `event-${event.id}`,
            type: "event" as const,
            title: event.title,
            date: eventDate,
            startTime,
            endTime,
            color: "accent",
            data: event,
          };
          console.log("Adding event item:", item);
          items.push(item);
        });
      }

      console.log("Total calendar items created:", items.length);
      console.log("Items by date:", items.reduce((acc, item) => {
        acc[item.date] = (acc[item.date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));
      
      setCalendarItems(items);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: any) => {
    const item = event.active.data.current as CalendarItem;
    setActiveDragItem(item);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (!over || !timetableId) return;

    const draggedItem = active.data.current as CalendarItem;
    const newDate = over.id as string;

    if (draggedItem.date === newDate) return;

    try {
      if (draggedItem.type === "session") {
        // Update timetable session
        const { data: timetable } = await supabase
          .from("timetables")
          .select("schedule")
          .eq("id", timetableId)
          .single();

        if (!timetable) throw new Error("Timetable not found");

        const schedule = (timetable.schedule || {}) as Record<string, any[]>;
        console.log("Current schedule before update:", schedule);
        
        const scheduleCopy: Record<string, any[]> = {};
        Object.entries(schedule).forEach(([date, sessions]) => {
          scheduleCopy[date] = Array.isArray(sessions) ? [...sessions] : [];
        });
        
        // Remove from old date
        const oldSessions = scheduleCopy[draggedItem.date] || [];
        const sessionIndex = draggedItem.data.sessionIndex as number;
        
        if (sessionIndex < 0 || sessionIndex >= oldSessions.length) {
          console.error("Invalid session index for drag:", sessionIndex, "for date", draggedItem.date);
          return;
        }
        
        const [movedSession] = oldSessions.splice(sessionIndex, 1);
        scheduleCopy[draggedItem.date] = oldSessions;

        // Add to new date
        const newSessions = scheduleCopy[newDate] ? [...scheduleCopy[newDate]] : [];
        newSessions.push(movedSession);
        newSessions.sort((a: any, b: any) => {
          const timeA = a.time || a.startTime || "00:00";
          const timeB = b.time || b.startTime || "00:00";
          return timeA.localeCompare(timeB);
        });
        scheduleCopy[newDate] = newSessions;

        console.log("Updated schedule:", scheduleCopy);

        const { error } = await supabase
          .from("timetables")
          .update({ schedule: scheduleCopy as any })
          .eq("id", timetableId);

        if (error) throw error;

        toast.success("Study session rescheduled");
        fetchCalendarData();
      } else if (draggedItem.type === "event") {
        // Update event
        const oldDate = parseISO(draggedItem.data.start_time);
        const newDateObj = parseISO(newDate + "T" + format(oldDate, "HH:mm:ss"));
        const duration = parseISO(draggedItem.data.end_time).getTime() - oldDate.getTime();
        const newEndDate = new Date(newDateObj.getTime() + duration);

        const { error } = await supabase
          .from("events")
          .update({
            start_time: newDateObj.toISOString(),
            end_time: newEndDate.toISOString(),
          })
          .eq("id", draggedItem.data.id);

        if (error) throw error;

        toast.success("Event rescheduled");
        fetchCalendarData();
      }
    } catch (error) {
      console.error("Error rescheduling:", error);
      toast.error("Failed to reschedule");
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <Header />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-4">
              {availableTimetables.length > 0 && (
                <Select value={selectedTimetable || ""} onValueChange={setSelectedTimetable}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Select a timetable" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimetables.map((tt) => (
                      <SelectItem key={tt.id} value={tt.id}>
                        {tt.name} ({format(parseISO(tt.start_date), "MMM d")} - {format(parseISO(tt.end_date), "MMM d, yyyy")})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-[200px] justify-center">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">
                  {format(currentWeek, "MMM d")} - {format(addDays(currentWeek, 6), "MMM d, yyyy")}
                </h2>
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
                Today
              </Button>
            </div>
          </div>

          {/* Legend */}
          <Card className="border-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Session Types & Time Slot Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold mb-2 text-muted-foreground">Session Types:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-500">
                      <div className="w-1 h-12 rounded bg-blue-500"></div>
                      <div>
                        <p className="font-semibold text-sm">Revision</p>
                        <p className="text-xs text-muted-foreground">Study sessions</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-500">
                      <div className="w-1 h-12 rounded bg-purple-500"></div>
                      <div>
                        <p className="font-semibold text-sm">Homework</p>
                        <p className="text-xs text-muted-foreground">Assignments</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border-2 border-red-500">
                      <div className="w-1 h-12 rounded bg-red-500"></div>
                      <div>
                        <p className="font-semibold text-sm">Events</p>
                        <p className="text-xs text-muted-foreground">🚫 Blocked times</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border-2 border-orange-500">
                      <div className="w-1 h-12 rounded bg-orange-500"></div>
                      <div>
                        <p className="font-semibold text-sm">Test Prep</p>
                        <p className="text-xs text-muted-foreground">Exam related</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-semibold mb-2 text-muted-foreground">Time Slot Indicators:</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-6 rounded bg-red-200 dark:bg-red-900/40 border border-red-400 dark:border-red-600"></div>
                      <span className="text-sm">Blocked by event</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-6 rounded bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700"></div>
                      <span className="text-sm">Available for study</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Time slots show hourly availability from 8 AM to 6 PM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CalendarIcon className="h-6 w-6" />
                    Weekly Calendar
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Drag and drop sessions to reschedule them to different days</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedTimetable ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Please select a timetable to view the calendar</p>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
                </div>
              ) : calendarItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No sessions or events found for this week</p>
                  <p className="text-sm text-muted-foreground">Try selecting a different week or timetable</p>
                </div>
              ) : (
                <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                  <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {weekDays.map((day) => (
                      <DroppableDay key={day.toISOString()} date={day} items={calendarItems} />
                    ))}
                  </div>
                  <DragOverlay>
                    {activeDragItem && (
                      <div
                        className={`p-3 rounded-lg border-l-4 shadow-2xl scale-105 ${
                          activeDragItem.type === "event"
                            ? "bg-red-100 dark:bg-red-950/40 border-red-500"
                            : activeDragItem.data?.type === "homework"
                            ? "bg-purple-100 dark:bg-purple-950/40 border-purple-500"
                            : activeDragItem.data?.type === "revision"
                            ? "bg-blue-100 dark:bg-blue-950/40 border-blue-500"
                            : "bg-primary/20 dark:bg-primary/15 border-primary"
                        }`}
                      >
                        <p className="text-sm font-semibold">{activeDragItem.title}</p>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 mt-1">
                          <span className="text-xs">🕐</span>
                          {activeDragItem.startTime} - {activeDragItem.endTime}
                        </p>
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              )}
            </CardContent>
          </Card>

          {selectedTimetable && (
            <div className="flex justify-center pt-6">
              <Button
                size="lg"
                onClick={() => navigate(`/timetable/${selectedTimetable}`)}
                className="gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                Navigate to Timetable View
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CalendarView;
