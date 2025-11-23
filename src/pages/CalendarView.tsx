import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-2 mb-2 rounded-lg border-l-4 cursor-move transition-all hover:shadow-md ${
        item.type === "session" ? "bg-primary/10 border-primary" : "bg-accent/20 border-accent"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground">
            {item.startTime} - {item.endTime}
          </p>
        </div>
        <Badge variant={item.type === "session" ? "default" : "secondary"} className="text-xs shrink-0">
          {item.type === "session" ? "Study" : "Event"}
        </Badge>
      </div>
    </div>
  );
};

const DroppableDay = ({ date, items, children }: { date: Date; items: CalendarItem[]; children?: React.ReactNode }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: format(date, "yyyy-MM-dd"),
    data: { date },
  });

  return (
    <div
      ref={setNodeRef}
      className={`border rounded-lg p-3 min-h-[200px] transition-colors ${
        isOver ? "bg-primary/5 border-primary" : "bg-card"
      }`}
    >
      <div className="font-semibold text-sm mb-3 pb-2 border-b">
        <div className="flex items-center justify-between">
          <span>{format(date, "EEE")}</span>
          <span className={`text-xs ${isSameDay(date, new Date()) ? "text-primary" : "text-muted-foreground"}`}>
            {format(date, "d")}
          </span>
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
        {items
          .filter((item) => item.date === format(date, "yyyy-MM-dd"))
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((item) => (
            <DraggableItem key={item.id} item={item} />
          ))}
        {items.filter((item) => item.date === format(date, "yyyy-MM-dd")).length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No sessions</p>
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
                  data: { sessionIndex: index, date },
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Weekly Calendar
              </CardTitle>
              <p className="text-sm text-muted-foreground">Drag and drop to reschedule sessions and events</p>
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
                  <div className="grid grid-cols-7 gap-3">
                    {weekDays.map((day) => (
                      <DroppableDay key={day.toISOString()} date={day} items={calendarItems} />
                    ))}
                  </div>
                  <DragOverlay>
                    {activeDragItem && (
                      <div
                        className={`p-2 rounded-lg border-l-4 shadow-lg ${
                          activeDragItem.type === "session"
                            ? "bg-primary/10 border-primary"
                            : "bg-accent/20 border-accent"
                        }`}
                      >
                        <p className="text-xs font-semibold">{activeDragItem.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activeDragItem.startTime} - {activeDragItem.endTime}
                        </p>
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-l-4 border-primary bg-primary/10"></div>
              <span>Study Sessions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded border-l-4 border-accent bg-accent/20"></div>
              <span>Events</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CalendarView;
