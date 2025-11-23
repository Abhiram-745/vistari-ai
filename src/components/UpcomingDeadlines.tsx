import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, BookOpen } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface Deadline {
  id: string;
  type: "test" | "homework";
  subject: string;
  title: string;
  date: string;
  testType?: string;
}

interface UpcomingDeadlinesProps {
  userId: string;
}

export const UpcomingDeadlines = ({ userId }: UpcomingDeadlinesProps) => {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

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
    }));

    // Combine and sort by date
    const allDeadlines = [...formattedTests, ...formattedHomework]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);

    setDeadlines(allDeadlines);
    setLoading(false);
  };

  const getDaysUntil = (dateString: string) => {
    const days = differenceInDays(new Date(dateString), new Date());
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  };

  const getUrgencyColor = (dateString: string) => {
    const days = differenceInDays(new Date(dateString), new Date());
    if (days <= 1) return "text-red-600 dark:text-red-400";
    if (days <= 3) return "text-orange-600 dark:text-orange-400";
    if (days <= 7) return "text-yellow-600 dark:text-yellow-400";
    return "text-muted-foreground";
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
    <Card className="shadow-md border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deadlines.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <div className="text-4xl">🎉</div>
            <p className="font-medium text-foreground">All Caught Up!</p>
            <p className="text-sm text-muted-foreground">
              No upcoming deadlines at the moment
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {deadlines.map((deadline) => (
              <div
                key={`${deadline.type}-${deadline.id}`}
                className="group relative flex items-center gap-3 p-3 rounded-lg border bg-gradient-to-r from-card to-card/50 hover:from-muted/50 hover:to-muted/30 transition-all duration-200 hover:shadow-sm"
              >
                <div className="flex-shrink-0">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    {deadline.type === "test" ? (
                      <BookOpen className="h-4 w-4 text-primary" />
                    ) : (
                      <Clock className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="font-semibold text-foreground truncate leading-tight">
                    {deadline.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {deadline.subject}
                  </p>
                </div>
                
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    getDaysUntil(deadline.date) === "Today" 
                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      : getDaysUntil(deadline.date) === "Tomorrow"
                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {getDaysUntil(deadline.date)}
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {format(new Date(deadline.date), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
