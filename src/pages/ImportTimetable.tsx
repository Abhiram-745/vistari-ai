import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PreferencesStep from "@/components/onboarding/PreferencesStep";
import DifficultTopicsStep from "@/components/onboarding/DifficultTopicsStep";
import TestDatesStep from "@/components/onboarding/TestDatesStep";

const ImportTimetable = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sharedTimetable, shareId, sharedBy } = location.state || {};

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  
  // State for imported data
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any>({});
  const [testDates, setTestDates] = useState<TestDate[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  
  // State for customization
  const [preferences, setPreferences] = useState<any>({
    daily_study_hours: 2,
    session_duration: 45,
    break_duration: 15,
    day_time_slots: [
      { day: "monday", enabled: true, startTime: "09:00", endTime: "17:00" },
      { day: "tuesday", enabled: true, startTime: "09:00", endTime: "17:00" },
      { day: "wednesday", enabled: true, startTime: "09:00", endTime: "17:00" },
      { day: "thursday", enabled: true, startTime: "09:00", endTime: "17:00" },
      { day: "friday", enabled: true, startTime: "09:00", endTime: "17:00" },
      { day: "saturday", enabled: true, startTime: "09:00", endTime: "17:00" },
      { day: "sunday", enabled: true, startTime: "09:00", endTime: "17:00" }
    ]
  });
  const [topicConfidences, setTopicConfidences] = useState<any>({});
  const [events, setEvents] = useState<any[]>([]);
  const [parsedTopics, setParsedTopics] = useState<any[]>([]);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (!sharedTimetable) {
      navigate('/groups');
      return;
    }
    
    initializeData();
    loadUserData();
  }, []);

  const initializeData = () => {
    // Extract subjects and topics from shared timetable
    const subjectsArray = Array.isArray(sharedTimetable.subjects)
      ? sharedTimetable.subjects
      : Object.values(sharedTimetable.subjects || {});
    
    setSubjects(subjectsArray);
    setTopics(sharedTimetable.topics || {});
    
    // Parse topics for difficulty step
    const topicsArray = Object.entries(sharedTimetable.topics || {}).flatMap(([subjectIdx, topicList]: [string, any]) => {
      return (topicList || []).map((topicName: string) => ({
        name: topicName,
        subject_id: subjectIdx
      }));
    });
    setParsedTopics(topicsArray);
    
    // Convert test dates
    const testDatesArray = sharedTimetable.test_dates 
      ? Object.entries(sharedTimetable.test_dates).flatMap(([subjectIdx, dates]: [string, any]) => {
          return (dates || []).map((date: any) => ({
            subject_id: subjectIdx,
            test_date: date.date || date.test_date,
            test_type: date.type || date.test_type || 'Exam'
          }));
        })
      : [];
    setTestDates(testDatesArray);
    
    setStartDate(new Date(sharedTimetable.start_date));
    setEndDate(new Date(sharedTimetable.end_date));
  };

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUserId(user.id);

      // Load user preferences
      const { data: prefsData } = await supabase
        .from('study_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (prefsData) {
        setPreferences(prefsData);
      }

      // Load user events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .gte('end_time', new Date().toISOString());

      if (eventsData) {
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    if (!preferences) {
      toast.error('Please set your study preferences');
      return;
    }

    setLoading(true);
    try {
      // Call generate-timetable edge function with imported data
      const { data, error } = await supabase.functions.invoke('generate-timetable', {
        body: {
          subjects,
          topics,
          testDates,
          preferences: {
            ...preferences,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          },
          topicConfidences,
          events,
          basedOnShare: {
            shareId,
            sharedBy,
            originalName: sharedTimetable.name
          }
        }
      });

      if (error) throw error;

      if (data?.timetableId) {
        toast.success('Timetable created successfully!');
        navigate(`/timetable/${data.timetableId}`);
      }
    } catch (error) {
      console.error('Error generating timetable:', error);
      toast.error('Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  if (!sharedTimetable) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <Card className="p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-foreground">
                Customize Your Timetable
              </h1>
              <span className="text-sm text-muted-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <p className="text-muted-foreground mb-4">
              Implementing "{sharedTimetable.name}" from {sharedBy}
            </p>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-6">
            {currentStep === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Your Study Preferences
                </h2>
                <PreferencesStep
                  preferences={preferences}
                  setPreferences={setPreferences}
                />
                <Button onClick={handleNext} className="w-full mt-4">
                  Next
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Topic Confidence Levels
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Rate your confidence for each topic (1-10). Lower scores get more study time.
                </p>
                <DifficultTopicsStep
                  subjects={subjects.map((s: any, idx: number) => ({
                    name: typeof s === 'string' ? s : s.name,
                    exam_board: typeof s === 'object' ? s.exam_board : undefined
                  }))}
                  topics={parsedTopics}
                  onAnalysisComplete={(analysis) => {
                    setTopicConfidences(analysis);
                    handleNext();
                  }}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-4">
                  Confirm & Generate
                </h2>
                <div className="space-y-4 mb-6">
                  <Card className="p-4 bg-muted">
                    <h3 className="font-semibold text-foreground mb-2">Summary</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        <strong>Subjects:</strong> {subjects.length}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Study Period:</strong>{' '}
                        {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Daily Study Hours:</strong> {preferences?.daily_study_hours || 2}
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Session Duration:</strong> {preferences?.session_duration || 45} minutes
                      </p>
                      <p className="text-muted-foreground">
                        <strong>Events to Avoid:</strong> {events.length}
                      </p>
                    </div>
                  </Card>

                  <TestDatesStep
                    subjects={subjects.map((s: any, idx: number) => ({
                      name: typeof s === 'string' ? s : s.name,
                      exam_board: typeof s === 'object' ? s.exam_board : undefined
                    }))}
                    testDates={testDates}
                    setTestDates={setTestDates}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {loading ? (
                    <>Generating Your Personalized Timetable...</>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate My Timetable
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {currentStep < totalSteps && currentStep !== 1 && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ImportTimetable;
