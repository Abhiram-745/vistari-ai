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

  // Get visual styling based on type
  const getItemStyles = () => {
    if (item.type === "event") {
      return {
        bg: "bg-red-500/90 dark:bg-red-600/90 hover:bg-red-600 dark:hover:bg-red-700",
        text: "text-white",
        icon: "⛔"
      };
    }
    
    const sessionType = item.data?.type;
    
    if (sessionType === "homework") {
      return {
        bg: "bg-purple-500/90 dark:bg-purple-600/90 hover:bg-purple-600 dark:hover:bg-purple-700",
        text: "text-white",
        icon: "📝"
      };
    } else if (sessionType === "revision") {
      return {
        bg: "bg-blue-500/90 dark:bg-blue-600/90 hover:bg-blue-600 dark:hover:bg-blue-700",
        text: "text-white",
        icon: "📚"
      };
    } else if (sessionType === "break") {
      return {
        bg: "bg-muted/70 hover:bg-muted/90",
        text: "text-muted-foreground",
        icon: "☕"
      };
    } else if (item.data?.testDate) {
      return {
        bg: "bg-orange-500/90 dark:bg-orange-600/90 hover:bg-orange-600 dark:hover:bg-orange-700",
        text: "text-white",
        icon: "🎯"
      };
    }
    
    return {
      bg: "bg-primary/80 dark:bg-primary/70 hover:bg-primary/90",
      text: "text-primary-foreground",
      icon: "📖"
    };
  };

  const styles = getItemStyles();
  const duration = item.data?.duration || 60;
  // Calculate height based on duration (min 40px, max 120px)
  const height = Math.min(Math.max(duration / 1.5, 40), 120);

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <div
          ref={setNodeRef}
          style={{ ...style, height: `${height}px` }}
          {...listeners}
          {...attributes}
          className={`mb-2 rounded-md cursor-move transition-all hover:shadow-lg ${styles.bg} ${styles.text} p-2 flex flex-col justify-between overflow-hidden group`}
        >
          <div className="flex items-start justify-between gap-1.5 mb-1">
            <span className="text-base shrink-0">{styles.icon}</span>
            {item.data?.completed && (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 opacity-90" />
            )}
          </div>
          <div className="flex-1 min-h-0">
            <p className="text-sm font-semibold leading-snug line-clamp-2">{item.title}</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium opacity-90 mt-1">
            <Clock className="h-3 w-3" />
            <span>{item.startTime}</span>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4 bg-background/95 backdrop-blur-sm z-50" side="right" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{styles.icon}</span>
            <div>
              <p className="text-sm font-bold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.type === "event" ? "Event" : item.data?.type === "homework" ? "Homework" : item.data?.type === "revision" ? "Revision" : "Study Session"}
              </p>
            </div>
          </div>
          
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{item.startTime} - {item.endTime}</span>
              {item.data?.duration && (
                <span className="text-xs text-muted-foreground">({item.data.duration} min)</span>
              )}
            </div>
            
            {item.data?.subject && (
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{item.data.subject}</span>
              </div>
            )}
            
            {item.data?.topic && (
              <p className="text-xs text-muted-foreground pl-6">{item.data.topic}</p>
            )}
            
            {item.data?.completed !== undefined && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 ${item.data.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${item.data.completed ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {item.data.completed ? 'Completed' : 'Not completed'}
                </span>
              </div>
            )}
            
            {item.data?.notes && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">{item.data.notes}</p>
              </div>
            )}
            
            {item.type === "event" && item.data?.description && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">{item.data.description}</p>
              </div>
            )}
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
  
  // Count items by type for quick visual reference
  const itemCounts = {
    homework: dayItems.filter(i => i.data?.type === "homework").length,
    revision: dayItems.filter(i => i.data?.type === "revision").length,
    events: dayItems.filter(i => i.type === "event").length,
  };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg p-3 min-h-[320px] transition-all ${
        isOver 
          ? "bg-primary/10 border-2 border-primary shadow-lg" 
          : isToday
          ? "bg-primary/5 border-2 border-primary/30"
          : "bg-card/50 border border-border/50"
      }`}
    >
      {/* Minimal header */}
      <div className="mb-3 pb-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase text-muted-foreground">
            {format(date, "EEE")}
          </span>
          {/* Visual indicators for item types */}
          {itemCounts.homework > 0 && (
            <span className="text-xs bg-purple-500/20 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
              📝{itemCounts.homework}
            </span>
          )}
          {itemCounts.events > 0 && (
            <span className="text-xs bg-red-500/20 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">
              ⛔{itemCounts.events}
            </span>
          )}
        </div>
        <div className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm ${
          isToday 
            ? "bg-primary text-primary-foreground" 
            : "text-foreground"
        }`}>
          {format(date, "d")}
        </div>
      </div>
      
      {/* Items list - sorted by time */}
      <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-280px)]">
        {dayItems.length > 0 ? (
          dayItems
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((item) => <DraggableItem key={item.id} item={item} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-2xl mb-1 opacity-40">—</div>
            <p className="text-xs text-muted-foreground">Free day</p>
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
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span>🎨</span>
                Color Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Quick Reference</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                      <span className="text-lg">📚</span>
                      <span className="text-xs font-medium">Revision</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
                      <span className="text-lg">📝</span>
                      <span className="text-xs font-medium">Homework</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                      <span className="text-lg">⛔</span>
                      <span className="text-xs font-medium">Blocked</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-500/10 border border-orange-500/30">
                      <span className="text-lg">🎯</span>
                      <span className="text-xs font-medium">Test Prep</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarIcon className="h-4 w-4" />
                  Week of {format(currentWeek, "MMM d")}
                </CardTitle>
                <p className="text-xs text-muted-foreground">Drag & drop to reschedule</p>
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
