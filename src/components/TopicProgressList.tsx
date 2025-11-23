import { useEffect, useState } from "react";
import { useTopicProgressBySubject } from "@/hooks/useTopicProgress";
import { TopicProgressCard } from "./TopicProgressCard";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface TopicProgressListProps {
  subjectId: string;
}

export const TopicProgressList = ({ subjectId }: TopicProgressListProps) => {
  const [userId, setUserId] = useState<string>();
  const [topicNames, setTopicNames] = useState<Record<string, string>>({});
  const { data: progressData = [], isLoading } = useTopicProgressBySubject(userId, subjectId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  useEffect(() => {
    const fetchTopicNames = async () => {
      if (progressData.length === 0) return;

      const topicIds = progressData.map(p => p.topic_id);
      const { data: topics } = await supabase
        .from("topics")
        .select("id, name")
        .in("id", topicIds);

      if (topics) {
        const namesMap: Record<string, string> = {};
        topics.forEach(t => namesMap[t.id] = t.name);
        setTopicNames(namesMap);
      }
    };

    fetchTopicNames();
  }, [progressData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (progressData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No progress data yet. Start studying to track your progress!
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {progressData.map((progress) => (
        <TopicProgressCard
          key={progress.id}
          progress={progress}
          topicName={topicNames[progress.topic_id] || "Loading..."}
        />
      ))}
    </div>
  );
};
