import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import TimetableModeStep, { TimetableMode } from "./onboarding/TimetableModeStep";
import SubjectsStep from "./onboarding/SubjectsStep";
import TopicsStep from "./onboarding/TopicsStep";
import DifficultTopicsStep from "./onboarding/DifficultTopicsStep";
import TestDatesStep from "./onboarding/TestDatesStep";
import PreferencesStep from "./onboarding/PreferencesStep";
import HomeworkStep, { Homework } from "./onboarding/HomeworkStep";
import GenerateStep from "./onboarding/GenerateStep";

interface OnboardingWizardProps {
  onComplete: () => void;
  onCancel?: () => void;
}

export interface Subject {
  id?: string;
  name: string;
  exam_board: string;
}

export interface Topic {
  id?: string;
  subject_id: string;
  name: string;
  confidence?: number;
  difficulties?: string;
}

export interface TestDate {
  id?: string;
  subject_id: string;
  test_date: string;
  test_type: string;
}

export interface DayTimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export interface StudyPreferences {
  daily_study_hours: number;
  day_time_slots: DayTimeSlot[];
  break_duration: number;
  session_duration: number;
  duration_mode: "fixed" | "flexible";
  aiNotes?: string;
  study_before_school?: boolean;
  study_during_lunch?: boolean;
  study_during_free_periods?: boolean;
  before_school_start?: string;
  before_school_end?: string;
  lunch_start?: string;
  lunch_end?: string;
  free_period_times?: string[];
}

const OnboardingWizard = ({ onComplete, onCancel }: OnboardingWizardProps) => {
  const [step, setStep] = useState(1);
  const [timetableMode, setTimetableMode] = useState<TimetableMode | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicAnalysis, setTopicAnalysis] = useState<any>(null);
  const [testDates, setTestDates] = useState<TestDate[]>([]);
  const [preferences, setPreferences] = useState<StudyPreferences>({
    daily_study_hours: 2,
    day_time_slots: [
      { day: "monday", startTime: "09:00", endTime: "17:00", enabled: true },
      { day: "tuesday", startTime: "09:00", endTime: "17:00", enabled: true },
      { day: "wednesday", startTime: "09:00", endTime: "17:00", enabled: true },
      { day: "thursday", startTime: "09:00", endTime: "17:00", enabled: true },
      { day: "friday", startTime: "09:00", endTime: "17:00", enabled: true },
      { day: "saturday", startTime: "09:00", endTime: "17:00", enabled: true },
      { day: "sunday", startTime: "09:00", endTime: "17:00", enabled: true },
    ],
    break_duration: 15,
    session_duration: 45,
    duration_mode: "flexible",
  });
  const [homeworks, setHomeworks] = useState<Homework[]>([]);

  const totalSteps = 8;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      // Skip test dates step if no-exam mode
      if (step === 4 && timetableMode === "no-exam") {
        setStep(step + 2); // Skip step 5 (test dates)
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step === 1 && onCancel) {
      onCancel();
    } else if (step > 1) {
      // Skip test dates step if no-exam mode when going back
      if (step === 6 && timetableMode === "no-exam") {
        setStep(step - 2); // Skip step 5 (test dates)
      } else {
        setStep(step - 1);
      }
    }
  };

  const stepTitles = [
    "Choose Your Mode",
    "Your GCSE Subjects",
    "Topics You're Studying",
    "AI Topic Analysis",
    "Upcoming Test Dates",
    "Study Preferences",
    "Homework Assignments",
    "Generate Timetable",
  ];

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <CardTitle className="text-2xl">{stepTitles[step - 1]}</CardTitle>
        <CardDescription>
          {step === 1 && "Select the type of timetable that fits your study goals"}
          {step === 2 && (timetableMode === "no-exam" 
            ? "GCSE subjects that you need a bit more practice on" 
            : "Add the subjects you're taking for your GCSEs")}
          {step === 3 && "Tell us which topics you're currently studying"}
          {step === 4 && "AI will analyze your topics to prioritize difficult areas"}
          {step === 5 && "When are your tests scheduled?"}
          {step === 6 && "Set your study preferences"}
          {step === 7 && "Add any homework assignments to include in your timetable"}
          {step === 8 && "Review and generate your personalized timetable"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {step === 1 && (
          <TimetableModeStep 
            selectedMode={timetableMode} 
            onModeSelect={setTimetableMode}
          />
        )}
        {step === 2 && (
          <SubjectsStep subjects={subjects} setSubjects={setSubjects} />
        )}
        {step === 3 && (
          <TopicsStep subjects={subjects} topics={topics} setTopics={setTopics} />
        )}
        {step === 4 && (
          <DifficultTopicsStep 
            subjects={subjects} 
            topics={topics} 
            onAnalysisComplete={setTopicAnalysis}
            onSkip={handleNext}
          />
        )}
        {step === 5 && timetableMode !== "no-exam" && (
          <TestDatesStep subjects={subjects} testDates={testDates} setTestDates={setTestDates} />
        )}
        {step === 6 && (
          <PreferencesStep preferences={preferences} setPreferences={setPreferences} />
        )}
        {step === 7 && (
          <HomeworkStep subjects={subjects} homeworks={homeworks} setHomeworks={setHomeworks} />
        )}
        {step === 8 && (
          <GenerateStep
            subjects={subjects}
            topics={topics}
            testDates={testDates}
            preferences={preferences}
            homeworks={homeworks}
            topicAnalysis={topicAnalysis}
            timetableMode={timetableMode}
            onComplete={onComplete}
          />
        )}

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
          >
            Back
          </Button>
          {step < totalSteps && (
            <Button
              onClick={handleNext}
              className="bg-gradient-primary hover:opacity-90"
              disabled={
                (step === 1 && !timetableMode) ||
                (step === 2 && subjects.length === 0) ||
                (step === 3 && topics.length === 0) ||
                (step === 5 && timetableMode !== "no-exam" && testDates.length === 0)
              }
            >
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OnboardingWizard;
