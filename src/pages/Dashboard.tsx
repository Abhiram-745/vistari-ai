import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Target, Trophy, Calendar } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import OnboardingWizard from "@/components/OnboardingWizard";
import TimetableList from "@/components/TimetableList";
import { HomeworkList } from "@/components/HomeworkList";
import { StudyStreakTracker } from "@/components/StudyStreakTracker";
import { WeeklyGoalsWidget } from "@/components/WeeklyGoalsWidget";
import { UpcomingDeadlines } from "@/components/UpcomingDeadlines";
import { EventsWidget } from "@/components/EventsWidget";
import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import { SpacedRepetitionPanel } from "@/components/SpacedRepetitionPanel";
import { AppSidebar } from "@/components/AppSidebar";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        checkSubjects(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        checkSubjects(session.user.id);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkSubjects = async (userId: string) => {
    // Check for both subjects and timetables
    const [subjectsResult, timetablesResult, profileResult] = await Promise.all([
      supabase.from("subjects").select("id").eq("user_id", userId).limit(1),
      supabase.from("timetables").select("id").eq("user_id", userId).limit(1),
      supabase.from("profiles").select("full_name").eq("id", userId).single()
    ]);
    
    const hasSubjects = subjectsResult.data && subjectsResult.data.length > 0;
    const hasTimetables = timetablesResult.data && timetablesResult.data.length > 0;
    
    // User has set up if they have either subjects or timetables
    setHasData(hasSubjects || hasTimetables);
    setProfile(profileResult.data);
    setLoading(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getFirstName = () => {
    if (!profile?.full_name) return "there";
    return profile.full_name.split(" ")[0];
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <AppSidebar onNewTimetable={() => setShowOnboarding(true)} />
      
      <div className="flex-1 flex flex-col min-h-screen w-full bg-gradient-to-br from-background via-muted/50 to-background relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>

        <Header onNewTimetable={() => setShowOnboarding(true)} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 w-full">
          {!hasData && !showOnboarding ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-8 animate-fade-in">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Welcome to Study Planner</span>
                </div>
                <h2 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Let's Get Started!
                </h2>
                <p className="text-muted-foreground max-w-lg text-lg">
                  Create your personalized study timetable. We'll ask about your GCSE subjects,
                  topics, and test dates to generate the perfect revision schedule.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setShowOnboarding(true)}
                className="bg-gradient-primary hover:opacity-90 hover:scale-105 transition-all duration-200 gap-2 shadow-lg text-base px-8 py-6"
              >
                <Plus className="h-5 w-5" />
                Get Started
              </Button>
            </div>
          ) : showOnboarding ? (
            <OnboardingWizard
              onComplete={() => {
                setShowOnboarding(false);
                setHasData(true);
                toast.success("Setup complete! You can now generate timetables.");
              }}
              onCancel={() => setShowOnboarding(false)}
            />
          ) : (
            <div className="space-y-8 animate-fade-in">
              {/* Welcome Section */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 p-8 shadow-lg">
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        {getGreeting()}, {getFirstName()}! 👋
                      </h1>
                      <p className="text-muted-foreground text-lg">
                        Ready to crush your study goals today?
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                      <div className="flex flex-col items-center p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/10 hover:scale-105 transition-transform">
                        <Target className="h-6 w-6 text-primary mb-1" />
                        <span className="text-xs text-muted-foreground">Goals</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/10 hover:scale-105 transition-transform">
                        <Trophy className="h-6 w-6 text-primary mb-1" />
                        <span className="text-xs text-muted-foreground">Streak</span>
                      </div>
                      <div className="flex flex-col items-center p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-primary/10 hover:scale-105 transition-transform">
                        <Calendar className="h-6 w-6 text-primary mb-1" />
                        <span className="text-xs text-muted-foreground">Schedule</span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Decorative gradient overlay */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl"></div>
              </div>

              {/* Progress Tracking Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Your Progress</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StudyStreakTracker userId={user?.id || ""} />
                  <WeeklyGoalsWidget userId={user?.id || ""} />
                  <UpcomingDeadlines userId={user?.id || ""} />
                </div>
              </div>

              {/* Spaced Repetition Section */}
              <div>
                <SpacedRepetitionPanel />
              </div>

              {/* Events Section */}
              <div>
                <EventsWidget />
              </div>

              {/* AI Analytics Section */}
              <div>
                <DashboardAnalytics userId={user?.id || ""} />
              </div>

              {/* Timetables Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Your Timetables</h2>
                  </div>
                  <Button
                    onClick={() => setShowOnboarding(true)}
                    className="bg-gradient-primary hover:opacity-90 hover:scale-105 transition-all duration-200 gap-2 shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    New Timetable
                  </Button>
                </div>
                <TimetableList userId={user?.id || ""} />
              </div>
              
              {/* Homework Section */}
              <div className="space-y-6">
                <HomeworkList userId={user?.id || ""} />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Dashboard;
