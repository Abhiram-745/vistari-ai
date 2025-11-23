import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Target, Trophy, Calendar, CheckCircle2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useUserRole } from "@/hooks/useUserRole";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [loading, setLoading] = useState(true);
  const { data: userRole } = useUserRole();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        checkSubjects(session.user.id);
      } else {
        navigate("/");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        checkSubjects(session.user.id);
      } else {
        navigate("/");
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating background elements - just like landing page */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="floating-blob top-20 -left-32 w-96 h-96 bg-primary/10 animate-float"></div>
        <div className="floating-blob top-40 right-10 w-[500px] h-[500px] bg-secondary/15 animate-float-delayed"></div>
        <div className="floating-blob bottom-20 left-1/3 w-80 h-80 bg-accent/10 animate-float-slow"></div>
      </div>

      <Header onNewTimetable={() => setShowOnboarding(true)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {!hasData && !showOnboarding ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/20 border border-secondary/30 shadow-sm">
                <Sparkles className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium text-secondary-foreground">Welcome to Study Planner</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold gradient-text">
                Let's Get Started!
              </h2>
              <p className="text-muted-foreground max-w-lg text-lg leading-relaxed">
                Create your personalized study timetable. We'll ask about your GCSE subjects,
                topics, and test dates to generate the perfect revision schedule.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setShowOnboarding(true)}
              className="gap-2 text-lg px-10 py-7 rounded-full"
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
            <div className="relative overflow-hidden rounded-3xl glass-card border-primary/30 p-8 shadow-xl">
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text">
                      {getGreeting()}, {getFirstName()}! 👋
                    </h1>
                    <p className="text-muted-foreground text-lg">
                      Ready to crush your study goals today?
                    </p>
                  </div>
                  <div className="hidden md:flex items-center gap-4">
                    <div className="flex flex-col items-center p-4 glass-card rounded-2xl border-primary/10 hover-lift">
                      <Target className="h-6 w-6 text-primary mb-1" />
                      <span className="text-xs text-muted-foreground font-medium">Goals</span>
                    </div>
                    <div className="flex flex-col items-center p-4 glass-card rounded-2xl border-primary/10 hover-lift">
                      <Trophy className="h-6 w-6 text-primary mb-1" />
                      <span className="text-xs text-muted-foreground font-medium">Streak</span>
                    </div>
                    <div className="flex flex-col items-center p-4 glass-card rounded-2xl border-primary/10 hover-lift">
                      <Calendar className="h-6 w-6 text-primary mb-1" />
                      <span className="text-xs text-muted-foreground font-medium">Schedule</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative gradient overlay */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl"></div>
            </div>

            {/* Progress Tracking Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-display font-bold">Your Progress</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StudyStreakTracker userId={user?.id || ""} />
                <WeeklyGoalsWidget userId={user?.id || ""} />
                <UpcomingDeadlines userId={user?.id || ""} />
              </div>
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
                  <h2 className="text-xl font-display font-bold">Your Timetables</h2>
                </div>
                <Button
                  onClick={() => setShowOnboarding(true)}
                  className="gap-2 rounded-full"
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

            {/* Pricing Cards Section */}
            <div className="py-16 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
              </div>

              <div className="relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="text-center space-y-4 mb-12"
                >
                  <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text">
                    {userRole === "paid" ? "Your Current Plan" : "Upgrade Your Experience"}
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {userRole === "paid" 
                      ? "You're on the Premium plan with unlimited access to all features"
                      : "Unlock unlimited AI-powered study planning"}
                  </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  {/* Free Plan Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 50, rotateX: 10 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    whileHover={{ y: -10, transition: { duration: 0.3 } }}
                    className="relative"
                    style={{ transformStyle: "preserve-3d", perspective: 1000 }}
                  >
                    {userRole === "free" && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-muted text-muted-foreground px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                          Current Plan
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-muted/10 rounded-3xl blur-xl opacity-50" />
                    <Card className={`relative border-2 ${userRole === "free" ? "border-primary" : ""} bg-card/95 backdrop-blur-sm shadow-xl transition-all duration-500 h-full`}>
                      <CardHeader className="space-y-6 pb-6">
                        <div className="inline-flex items-center gap-2 text-muted-foreground">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <Sparkles className="w-6 h-6" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <CardTitle className="text-2xl font-display">Free</CardTitle>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold">£0</span>
                            <span className="text-lg text-muted-foreground">/month</span>
                          </div>
                          <CardDescription className="text-base">
                            Try out AI-powered study planning
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">1 timetable creation</p>
                              <p className="text-xs text-muted-foreground">Generate your first schedule</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">1 regeneration per day</p>
                              <p className="text-xs text-muted-foreground">Daily schedule adjustments</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Basic AI insights</p>
                              <p className="text-xs text-muted-foreground">1 analysis per day</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">Study tracking</p>
                              <p className="text-xs text-muted-foreground">Session & progress tracking</p>
                            </div>
                          </li>
                        </ul>
                        {userRole !== "free" && (
                          <Button
                            variant="outline"
                            size="lg"
                            disabled
                            className="w-full text-base py-6"
                          >
                            Current Plan
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Premium Plan Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 50, rotateX: 10 }}
                    whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    whileHover={{ y: -15, transition: { duration: 0.3 } }}
                    className="relative"
                    style={{ transformStyle: "preserve-3d", perspective: 1000 }}
                  >
                    {userRole === "paid" ? (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <div className="bg-gradient-to-r from-accent via-primary to-secondary text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                          Current Plan
                        </div>
                      </div>
                    ) : (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="bg-gradient-to-r from-accent via-primary to-secondary text-white px-8 py-2 rounded-full text-sm font-bold shadow-2xl"
                        >
                          ⚡ Most Popular
                        </motion.div>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-secondary/40 rounded-3xl blur-2xl opacity-60 animate-pulse" />
                    <Card className="relative border-2 border-primary/50 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm shadow-2xl transition-all duration-500 h-full overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 pointer-events-none" />
                      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />

                      <CardHeader className="space-y-6 pb-6 relative z-10">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                            <Sparkles className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <CardTitle className="text-2xl font-display bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Premium
                          </CardTitle>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                              £5
                            </span>
                            <span className="text-lg text-muted-foreground">/month</span>
                          </div>
                          <CardDescription className="text-base">
                            Unlimited AI for serious students
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6 relative z-10">
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">Unlimited timetables</p>
                              <p className="text-xs text-muted-foreground">Create as many as you need</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">Unlimited regenerations</p>
                              <p className="text-xs text-muted-foreground">Adjust anytime, instantly</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">Unlimited AI insights</p>
                              <p className="text-xs text-muted-foreground">Deep performance analysis</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">Priority support</p>
                              <p className="text-xs text-muted-foreground">Get help when needed</p>
                            </div>
                          </li>
                          <li className="flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="h-3 w-3 text-white" />
                            </div>
                            <div>
                              <p className="text-sm font-bold">Early access</p>
                              <p className="text-xs text-muted-foreground">New features first</p>
                            </div>
                          </li>
                        </ul>
                        {userRole === "paid" ? (
                          <Button
                            size="lg"
                            disabled
                            className="w-full text-base py-6 bg-gradient-to-r from-primary via-secondary to-accent"
                          >
                            Current Plan
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              window.open("mailto:support@example.com?subject=Upgrade%20to%20Premium", "_blank");
                            }}
                            size="lg"
                            className="w-full text-base py-6 bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 hover:scale-105 transition-all shadow-xl text-white font-bold"
                          >
                            Upgrade to Premium
                          </Button>
                        )}
                        <p className="text-xs text-center text-muted-foreground">
                          Cancel anytime • No hidden fees
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
