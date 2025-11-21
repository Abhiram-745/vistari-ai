import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Subject, Topic, TestDate, StudyPreferences } from "../OnboardingWizard";

interface GenerateStepProps {
  subjects: Subject[];
  topics: Topic[];
  testDates: TestDate[];
  preferences: StudyPreferences;
  topicAnalysis?: any;
  onComplete: () => void;
}

const GenerateStep = ({
  subjects,
  topics,
  testDates,
  preferences,
  topicAnalysis,
  onComplete,
}: GenerateStepProps) => {
  const [loading, setLoading] = useState(false);
  const [timetableName, setTimetableName] = useState("My Study Timetable");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }

    setLoading(true);

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

      // Save subjects
      const { data: savedSubjects, error: subjectsError } = await supabase
        .from("subjects")
        .insert(
          subjects.map((s) => ({
            user_id: user.id,
            name: s.name,
            exam_board: s.exam_board,
          }))
        )
        .select();

      if (subjectsError) throw subjectsError;

      // Map old subject indices to new IDs
      const subjectIdMap: { [key: string]: string } = {};
      savedSubjects.forEach((saved, index) => {
        subjectIdMap[index.toString()] = saved.id;
      });

      // Save topics with correct subject IDs
      const { error: topicsError } = await supabase
        .from("topics")
        .insert(
          topics.map((t) => ({
            subject_id: subjectIdMap[t.subject_id],
            name: t.name,
            difficulty: t.difficulty,
            confidence_level: t.confidence_level,
          }))
        );

      if (topicsError) throw topicsError;

      // Save test dates with correct subject IDs
      const { error: datesError } = await supabase
        .from("test_dates")
        .insert(
          testDates.map((td) => ({
            subject_id: subjectIdMap[td.subject_id],
            test_date: td.test_date,
            test_type: td.test_type,
          }))
        );

      if (datesError) throw datesError;

      // Save preferences
      const { error: prefsError } = await supabase
        .from("study_preferences")
        .upsert([{
          user_id: user.id,
          daily_study_hours: preferences.daily_study_hours,
          session_duration: preferences.session_duration,
          break_duration: preferences.break_duration,
          day_time_slots: preferences.day_time_slots as any,
        }], { onConflict: 'user_id' });

      if (prefsError) throw prefsError;

      // Generate timetable using AI
      const { data: timetableData, error: generateError } = await supabase.functions.invoke(
        "generate-timetable",
        {
          body: {
            subjects: savedSubjects,
            topics: topics.map((t) => ({
              ...t,
              subject_id: subjectIdMap[t.subject_id],
            })),
            testDates: testDates.map((td) => ({
              ...td,
              subject_id: subjectIdMap[td.subject_id],
            })),
            preferences,
            homeworks: homeworks || [],
            topicAnalysis,
            startDate,
            endDate,
          },
        }
      );

      if (generateError) throw generateError;

      // Save generated timetable
      const { error: saveError } = await supabase
        .from("timetables")
        .insert({
          user_id: user.id,
          name: timetableName,
          start_date: startDate,
          end_date: endDate,
          schedule: timetableData.schedule,
          subjects: savedSubjects as any,
          topics: topics.map((t) => ({
            ...t,
            subject_id: subjectIdMap[t.subject_id],
          })) as any,
          test_dates: testDates.map((td) => ({
            ...td,
            subject_id: subjectIdMap[td.subject_id],
          })) as any,
          preferences: preferences as any,
        });

      if (saveError) throw saveError;

      toast.success("Timetable generated successfully!");
      onComplete();
    } catch (error: any) {
      console.error("Error generating timetable:", error);
      toast.error(error.message || "Failed to generate timetable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted p-4 rounded-lg space-y-2">
        <h3 className="font-semibold">Summary</h3>
        <ul className="text-sm space-y-1">
          <li>• {subjects.length} subjects</li>
          <li>• {topics.length} topics to cover</li>
          <li>• {testDates.length} upcoming tests</li>
          <li>• {preferences.daily_study_hours} hours study per day</li>
          <li>• {preferences.day_time_slots.filter(s => s.enabled).length} study days per week</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="timetable-name">Timetable Name</Label>
          <Input
            id="timetable-name"
            value={timetableName}
            onChange={(e) => setTimetableName(e.target.value)}
            placeholder="e.g., Spring Term Revision"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={loading || !startDate || !endDate}
        className="w-full bg-gradient-primary hover:opacity-90 gap-2"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Generating Your Timetable...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Generate AI-Powered Timetable
          </>
        )}
      </Button>
    </div>
  );
};

export default GenerateStep;
