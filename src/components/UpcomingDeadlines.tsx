import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, Clock, BookOpen } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface Deadline {
  id: string;
  type: "test" | "homework";
  subject: string;
  title: string;
  date: string;
  testType?: string;
  description?: string;
}

interface UpcomingDeadlinesProps {
  userId: string;
}

export const UpcomingDeadlines = ({ userId }: UpcomingDeadlinesProps) => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchDeadlines();
  }, [userId]);

  const fetchDeadlines = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    // Fetch test dates
    const { data: tests, error: testsError } = await supabase
      .from("test_dates")
      .select("*, subjects(name)")
      .gte("test_date", today)
      .order("test_date", { ascending: true });

    // Fetch homework
    const { data: homework, error: homeworkError } = await supabase
      .from("homeworks")
      .select("*")
      .eq("user_id", userId)
      .eq("completed", false)
      .gte("due_date", today)
      .order("due_date", { ascending: true })
      .limit(5);

    if (testsError || homeworkError) {
      console.error("Error fetching deadlines:", testsError || homeworkError);
      setLoading(false);
      return;
    }

    // Remove duplicate test dates (same subject + date)
    const uniqueTests = new Map();
    (tests || []).forEach((test: any) => {
      const key = `${test.subjects?.name}-${test.test_date}`;
      if (!uniqueTests.has(key)) {
        uniqueTests.set(key, test);
      }
    });

    // Combine and format deadlines
    const formattedTests: Deadline[] = Array.from(uniqueTests.values())
      .map((test: any) => ({
        id: test.id,
        type: "test" as const,
        subject: test.subjects?.name || "Unknown",
        title: test.test_type || "Test",
        date: test.test_date,
        testType: test.test_type,
      }))
      .slice(0, 5);

    const formattedHomework: Deadline[] = (homework || []).map((hw: any) => ({
      id: hw.id,
      type: "homework" as const,
      subject: hw.subject,
      title: hw.title,
      date: hw.due_date,
      description: hw.description,
    }));

    // Combine and sort by date
    const allDeadlines = [...formattedTests, ...formattedHomework]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    setDeadlines(allDeadlines);
    setLoading(false);
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString + 'T00:00:00');
    const days = differenceInDays(targetDate, today);
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  };

  const getUrgencyColor = (dateString: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString + 'T00:00:00');
    const days = differenceInDays(targetDate, today);
    if (days <= 1) return "text-red-600 dark:text-red-400";
    if (days <= 3) return "text-orange-600 dark:text-orange-400";
    if (days <= 7) return "text-yellow-600 dark:text-yellow-400";
    return "text-muted-foreground";
  };

  const handleDeadlineClick = async (deadline: Deadline) => {
    // If it's homework and we don't have description yet, fetch it
    if (deadline.type === "homework" && !deadline.description) {
      const { data } = await supabase
        .from("homeworks")
        .select("description")
        .eq("id", deadline.id)
        .single();
      
      if (data) {
        deadline.description = data.description;
      }
    }
    setSelectedDeadline(deadline);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Loading deadlines...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deadlines.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No upcoming deadlines. You're all caught up! 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {deadlines.map((deadline) => (
                <div
                  key={`${deadline.type}-${deadline.id}`}
                  onClick={() => handleDeadlineClick(deadline)}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <div className="mt-1">
                    {deadline.type === "test" ? (
                      <BookOpen className="h-4 w-4 text-primary" />
                    ) : (
                      <Clock className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="font-medium line-clamp-2 overflow-hidden">{deadline.title}</p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{deadline.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <p className="text-sm text-muted-foreground">{deadline.subject}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-medium ${getUrgencyColor(deadline.date)}`}>
                          {getDaysUntil(deadline.date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(deadline.date), "dd/MM/yyyy")}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDeadline?.type === "test" ? (
                <BookOpen className="h-5 w-5 text-primary" />
              ) : (
                <Clock className="h-5 w-5 text-primary" />
              )}
              {selectedDeadline?.title}
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Subject:</span>
                  <span className="text-sm text-muted-foreground">{selectedDeadline?.subject}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Due Date:</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedDeadline && format(new Date(selectedDeadline.date), "MMMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Time Until:</span>
                  <span className={`text-sm font-medium ${selectedDeadline && getUrgencyColor(selectedDeadline.date)}`}>
                    {selectedDeadline && getDaysUntil(selectedDeadline.date)}
                  </span>
                </div>
                
                {selectedDeadline?.type === "homework" && selectedDeadline?.description && (
                  <div className="pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Description:</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedDeadline.description}
                    </p>
                  </div>
                )}
                
                {selectedDeadline?.type === "test" && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      This is a {selectedDeadline.testType || "test"} for {selectedDeadline.subject}.
                    </p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
};
