import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Settings, Loader2 } from "lucide-react";
import { toast } from "sonner";
import SubjectsStep from "./onboarding/SubjectsStep";
import TopicsEditStep from "./onboarding/TopicsEditStep";
import TestDatesStep from "./onboarding/TestDatesStep";
import PreferencesStep from "./onboarding/PreferencesStep";
import HomeworkEditStep from "./onboarding/HomeworkEditStep";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Subject, Topic, TestDate, StudyPreferences } from "./OnboardingWizard";

interface TimetableEditDialogProps {
  timetableId: string;
  currentSubjects: Subject[];
  currentTopics: Topic[];
  currentTestDates: TestDate[];
  currentPreferences: StudyPreferences;
  startDate: string;
  endDate: string;
  onUpdate: () => void;
}

// Helper function to migrate old preferences format to new format
const migratePreferences = (prefs: any): StudyPreferences => {
  const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  
  // If already in new format with day_time_slots
  if (prefs.day_time_slots && Array.isArray(prefs.day_time_slots)) {
    return {
      daily_study_hours: prefs.daily_study_hours || 2,
      session_duration: prefs.session_duration,
      break_duration: prefs.break_duration,
      duration_mode: prefs.duration_mode || "flexible",
      day_time_slots: prefs.day_time_slots,
      aiNotes: prefs.aiNotes,
    };
  }

  // Otherwise, convert old format to new format
  const studyDays = prefs.study_days || [];
  const startTime = prefs.preferred_start_time || "09:00";
  const endTime = prefs.preferred_end_time || "17:00";

  return {
    daily_study_hours: prefs.daily_study_hours || 2,
    session_duration: prefs.session_duration || 45,
    break_duration: prefs.break_duration || 15,
    duration_mode: prefs.duration_mode || "flexible",
    day_time_slots: weekDays.map(day => ({
      day,
      startTime,
      endTime,
      enabled: studyDays.includes(day),
    })),
    aiNotes: prefs.aiNotes,
  };
};

export const TimetableEditDialog = ({
  timetableId,
  currentSubjects,
  currentTopics,
  currentTestDates,
  currentPreferences,
  startDate,
  endDate,
  onUpdate,
}: TimetableEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>(currentSubjects);
  const [topics, setTopics] = useState<Topic[]>(currentTopics);
  const [testDates, setTestDates] = useState<TestDate[]>(currentTestDates);
  const [preferences, setPreferences] = useState<StudyPreferences>(migratePreferences(currentPreferences));
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (subjects.length === 0) {
      toast.error("Please add at least one subject");
      return;
    }
    if (topics.length === 0) {
      toast.error("Please add at least one topic");
      return;
    }
    if (testDates.length === 0) {
      toast.error("Please add at least one test date");
      return;
    }

    setIsRegenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch user's homework
      const { data: homeworks, error: homeworkError } = await supabase
        .from("homeworks")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", false);

      if (homeworkError) throw homeworkError;

      // Fetch user's events within the timetable date range
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .gte("start_time", startDate)
        .lte("start_time", endDate)
        .order("start_time", { ascending: true });

      if (eventsError) throw eventsError;

      const { data: scheduleData, error: functionError } = await supabase.functions.invoke(
        "generate-timetable",
        {
          body: {
            subjects,
            topics,
            testDates,
            preferences,
            homeworks: homeworks?.map(({ id, title, subject, due_date, duration, description }) => ({
              id,
              title,
              subject,
              due_date,
              duration,
              description
            })) || [],
            events: events || [],
            aiNotes: preferences.aiNotes || "",
            startDate,
            endDate,
          },
        }
      );

      if (functionError) throw functionError;

      // Update the timetable with new schedule and configuration
      const { error: updateError } = await supabase
        .from("timetables")
        .update({
          schedule: scheduleData.schedule,
          subjects: subjects as any,
          topics: topics as any,
          test_dates: testDates as any,
          preferences: preferences as any,
        })
        .eq("id", timetableId);

      if (updateError) throw updateError;

      toast.success("Timetable regenerated successfully!");
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error regenerating timetable:", error);
      toast.error("Failed to regenerate timetable");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Edit & Regenerate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Timetable Configuration</DialogTitle>
          <DialogDescription>
            Add or modify subjects, topics, test dates, and preferences. Then regenerate your
            timetable with the updated configuration.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="subjects" className="w-full flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="topics">Topics</TabsTrigger>
            <TabsTrigger value="tests">Tests</TabsTrigger>
            <TabsTrigger value="homework">Homework</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="subjects" className="space-y-4 overflow-y-auto flex-1 pr-2">
            <SubjectsStep subjects={subjects} setSubjects={setSubjects} />
          </TabsContent>

          <TabsContent value="topics" className="space-y-4 overflow-y-auto flex-1 pr-2">
            <TopicsEditStep subjects={subjects} topics={topics} setTopics={setTopics} />
          </TabsContent>

          <TabsContent value="tests" className="space-y-4 overflow-y-auto flex-1 pr-2">
            <TestDatesStep subjects={subjects} testDates={testDates} setTestDates={setTestDates} />
          </TabsContent>

          <TabsContent value="homework" className="space-y-4 overflow-y-auto flex-1 pr-2">
            <HomeworkEditStep subjects={subjects} />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4 overflow-y-auto flex-1 pr-2">
            <PreferencesStep preferences={preferences} setPreferences={setPreferences} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isRegenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleRegenerate}
            disabled={isRegenerating || subjects.length === 0 || topics.length === 0 || testDates.length === 0}
            className="gap-2"
          >
            {isRegenerating && <Loader2 className="h-4 w-4 animate-spin" />}
            {isRegenerating ? "Regenerating..." : "Regenerate Timetable"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
