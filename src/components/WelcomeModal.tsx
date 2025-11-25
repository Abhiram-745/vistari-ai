import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen, Users, Brain, Target, CheckCircle2, Play } from "lucide-react";
import { motion } from "framer-motion";

const WelcomeModal = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    checkFirstLogin();
  }, []);

  const checkFirstLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const welcomeShown = localStorage.getItem(`welcome_shown_${user.id}`);
    
    if (!welcomeShown) {
      // Small delay for better UX
      setTimeout(() => setOpen(true), 1000);
    }
  };

  const handleComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem(`welcome_shown_${user.id}`, "true");
    }
    setOpen(false);
  };

  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Timetables",
      description: "Create personalized study schedules that adapt to your exams, homework, and learning pace.",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: BookOpen,
      title: "Smart Topic Tracking",
      description: "Track your progress across all subjects and topics with confidence ratings and mastery levels.",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: Users,
      title: "Study Groups",
      description: "Create groups, share timetables, compete in challenges, and learn together with friends.",
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: Brain,
      title: "AI Insights",
      description: "Get personalized recommendations based on your study patterns, peak hours, and performance.",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Target,
      title: "Interactive Tutorials",
      description: "Guided tours in every section help you discover features and master the platform quickly.",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  const steps = [
    {
      title: "Welcome to Vistari! 🎉",
      description: "Your AI-powered revision companion is ready to help you ace your GCSEs.",
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-3">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-lg">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Vistari uses AI to create personalized study timetables that adapt to your schedule, 
              learning style, and exam dates.
            </p>
          </div>
          <div className="grid gap-3">
            {[
              "📚 Generate AI-powered timetables in seconds",
              "🎯 Track progress across all subjects",
              "👥 Study with friends in groups",
              "🧠 Get personalized insights and recommendations",
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50"
              >
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Key Features",
      description: "Everything you need to succeed, all in one place",
      content: (
        <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto pr-2">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/30 transition-all"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center flex-shrink-0`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="font-semibold text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ),
    },
    {
      title: "Interactive Tutorials",
      description: "Never feel lost - we'll guide you every step of the way",
      content: (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-3">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-secondary flex items-center justify-center shadow-lg">
              <Play className="h-10 w-10 text-white" />
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Each section has an interactive tutorial with arrows and tooltips that guide you through 
              the features. You'll see these automatically when you visit a new section.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                First Visit Tours
              </h4>
              <p className="text-xs text-muted-foreground">
                Tutorials automatically appear when you visit a section for the first time
              </p>
            </div>
            
            <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-secondary" />
                Reset Anytime
              </h4>
              <p className="text-xs text-muted-foreground">
                Want to replay a tutorial? Reset them anytime from Profile Settings
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-warm border border-border">
            <p className="text-sm font-medium text-center">
              💡 Tip: Take your time with each tutorial - they're designed to help you get the most out of Vistari!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display gradient-text">
            {currentStepData.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          {currentStepData.content}
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleComplete}
            >
              Skip
            </Button>
            
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-gradient-primary gap-2"
              >
                Next
                <Sparkles className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-gradient-primary gap-2"
              >
                Get Started
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
