import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MasteryLevel = "not_started" | "beginner" | "intermediate" | "advanced" | "mastery";

export interface TopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  subject_id: string;
  progress_percentage: number;
  mastery_level: MasteryLevel;
  successful_sessions_count: number;
  total_sessions_count: number;
  last_reviewed_at: string | null;
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
}

export const getMasteryColor = (level: MasteryLevel): string => {
  const colors: Record<MasteryLevel, string> = {
    not_started: "bg-muted text-muted-foreground",
    beginner: "bg-red-500/10 text-red-500 border-red-500/20",
    intermediate: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    advanced: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    mastery: "bg-green-500/10 text-green-500 border-green-500/20",
  };
  return colors[level];
};

export const getMasteryLabel = (level: MasteryLevel): string => {
  const labels: Record<MasteryLevel, string> = {
    not_started: "Not Started",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    mastery: "Mastery",
  };
  return labels[level];
};

export const calculateMasteryLevel = (successRate: number, sessionCount: number): MasteryLevel => {
  if (sessionCount === 0) return "not_started";
  if (sessionCount < 3) return "beginner";
  if (successRate >= 90 && sessionCount >= 8) return "mastery";
  if (successRate >= 80 && sessionCount >= 5) return "advanced";
  if (successRate >= 60 && sessionCount >= 3) return "intermediate";
  return "beginner";
};

export const calculateNextReviewDate = (masteryLevel: MasteryLevel, lastReviewed: Date): Date => {
  const intervals: Record<MasteryLevel, number> = {
    not_started: 0,
    beginner: 1, // 1 day
    intermediate: 3, // 3 days
    advanced: 7, // 1 week
    mastery: 14, // 2 weeks
  };
  
  const daysToAdd = intervals[masteryLevel];
  const nextDate = new Date(lastReviewed);
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return nextDate;
};

export const useTopicProgress = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["topic-progress", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from("topic_progress")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as TopicProgress[];
    },
    enabled: !!userId,
  });
};

export const useTopicProgressBySubject = (userId: string | undefined, subjectId: string | undefined) => {
  return useQuery({
    queryKey: ["topic-progress", userId, subjectId],
    queryFn: async () => {
      if (!userId || !subjectId) return [];
      
      const { data, error } = await supabase
        .from("topic_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("subject_id", subjectId)
        .order("progress_percentage", { ascending: false });

      if (error) throw error;
      return data as TopicProgress[];
    },
    enabled: !!userId && !!subjectId,
  });
};

export const useUpdateTopicProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      topicId,
      subjectId,
      wasSuccessful,
    }: {
      userId: string;
      topicId: string;
      subjectId: string;
      wasSuccessful: boolean;
    }) => {
      // First, try to get existing progress
      const { data: existing } = await supabase
        .from("topic_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("topic_id", topicId)
        .maybeSingle();

      const newTotalSessions = (existing?.total_sessions_count || 0) + 1;
      const newSuccessfulSessions = (existing?.successful_sessions_count || 0) + (wasSuccessful ? 1 : 0);
      const successRate = (newSuccessfulSessions / newTotalSessions) * 100;
      const newProgress = Math.min(Math.round(successRate), 100);
      const newMasteryLevel = calculateMasteryLevel(successRate, newTotalSessions);
      const now = new Date();
      const nextReviewDate = calculateNextReviewDate(newMasteryLevel, now);

      const progressData = {
        user_id: userId,
        topic_id: topicId,
        subject_id: subjectId,
        progress_percentage: newProgress,
        mastery_level: newMasteryLevel,
        successful_sessions_count: newSuccessfulSessions,
        total_sessions_count: newTotalSessions,
        last_reviewed_at: now.toISOString(),
        next_review_date: nextReviewDate.toISOString().split("T")[0],
      };

      if (existing) {
        const { error } = await supabase
          .from("topic_progress")
          .update(progressData)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("topic_progress")
          .insert(progressData);

        if (error) throw error;
      }

      return progressData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["topic-progress"] });
      toast.success("Topic progress updated!");
    },
    onError: (error) => {
      console.error("Error updating topic progress:", error);
      toast.error("Failed to update topic progress");
    },
  });
};

export const useDueForReview = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["topic-progress-due", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const today = new Date().toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("topic_progress")
        .select("*")
        .eq("user_id", userId)
        .lte("next_review_date", today)
        .not("mastery_level", "eq", "mastery")
        .order("next_review_date", { ascending: true });

      if (error) throw error;
      return data as TopicProgress[];
    },
    enabled: !!userId,
  });
};
