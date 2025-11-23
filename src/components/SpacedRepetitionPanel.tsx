import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDueForReview } from "@/hooks/useTopicProgress";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export const SpacedRepetitionPanel = () => {
  const [userId, setUserId] = useState<string>();
  const { data: dueTopics = [] } = useDueForReview(userId);
  const [topicNames, setTopicNames] = useState<Record<string, string>>({});
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    const fetchNames = async () => {
      if (dueTopics.length === 0) return;

      const topicIds = dueTopics.map(t => t.topic_id);
      const subjectIds = [...new Set(dueTopics.map(t => t.subject_id))];

      const { data: topics } = await supabase
        .from("topics")
        .select("id, name")
        .in("id", topicIds);

      const { data: subjects } = await supabase
        .from("subjects")
        .select("id, name")
        .in("id", subjectIds);

      if (topics) {
        const namesMap: Record<string, string> = {};
        topics.forEach(t => namesMap[t.id] = t.name);
        setTopicNames(namesMap);
      }

      if (subjects) {
        const namesMap: Record<string, string> = {};
        subjects.forEach(s => namesMap[s.id] = s.name);
        setSubjectNames(namesMap);
      }
    };

    fetchNames();
  }, [dueTopics]);

  if (dueTopics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Spaced Repetition</CardTitle>
          </div>
          <CardDescription>
            No topics due for review right now
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              You're all caught up! Keep studying to build more topics for review.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Spaced Repetition</CardTitle>
          </div>
          <Badge variant="secondary" className="text-primary">
            {dueTopics.length} due
          </Badge>
        </div>
        <CardDescription>
          Topics ready for review to strengthen your memory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {dueTopics.map((topic) => (
          <div
            key={topic.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{topicNames[topic.topic_id] || "Loading..."}</p>
                <Badge variant="outline" className="text-xs">
                  {subjectNames[topic.subject_id] || "..."}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Due {format(new Date(topic.next_review_date!), "MMM d")}
                  </span>
                </div>
                <span>•</span>
                <span>
                  {topic.successful_sessions_count}/{topic.total_sessions_count} sessions
                </span>
              </div>
            </div>
            <Button size="sm" variant="outline">
              Review Now
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
