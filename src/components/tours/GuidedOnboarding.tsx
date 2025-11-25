import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Joyride, { Step, CallBackProps, STATUS, ACTIONS } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";

type OnboardingStage = 
  | "welcome"
  | "events"
  | "homework"
  | "timetable-create"
  | "timetable-features"
  | "completed";

interface GuidedOnboardingProps {
  onComplete?: () => void;
}

const GuidedOnboarding = ({ onComplete }: GuidedOnboardingProps) => {
  const [stage, setStage] = useState<OnboardingStage>("welcome");
  const [runTour, setRunTour] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (stage !== "welcome" && stage !== "completed") {
      // Small delay to ensure DOM elements are ready
      const timer = setTimeout(() => {
        updateTourForStage();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [stage, location.pathname]);

  const checkOnboardingStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const savedStage = localStorage.getItem(`onboarding_stage_${user.id}`);
    const completedFlag = localStorage.getItem(`onboarding_completed_${user.id}`);
    
    if (completedFlag === "true") {
      setStage("completed");
      return;
    }
    
    if (savedStage && savedStage !== "completed") {
      setStage(savedStage as OnboardingStage);
      setRunTour(false); // Reset to trigger update
    } else if (!savedStage) {
      // Start at events stage by default
      setStage("events");
      localStorage.setItem(`onboarding_stage_${user.id}`, "events");
    }
  };

  const updateTourForStage = () => {
    console.log("Tour: updateTourForStage called, stage:", stage, "path:", location.pathname);
    switch (stage) {
      case "events":
        if (location.pathname === "/events") {
          console.log("Tour: Setting events steps, runTour = true");
          setSteps(eventsOnboardingSteps);
          setRunTour(true);
        } else {
          console.log("Tour: Navigating to /events");
          navigate("/events");
        }
        break;
      case "homework":
        if (location.pathname === "/homework") {
          console.log("Tour: Setting homework steps, runTour = true");
          setSteps(homeworkOnboardingSteps);
          setRunTour(true);
        } else {
          console.log("Tour: Navigating to /homework");
          navigate("/homework");
        }
        break;
      case "timetable-create":
        if (location.pathname === "/timetables") {
          console.log("Tour: Setting timetable create steps, runTour = true");
          setSteps(timetableCreateSteps);
          setRunTour(true);
        } else {
          console.log("Tour: Navigating to /timetables");
          navigate("/timetables");
        }
        break;
      case "timetable-features":
        if (location.pathname === "/calendar") {
          console.log("Tour: Setting timetable features steps, runTour = true");
          setSteps(timetableFeaturesSteps);
          setRunTour(true);
        } else {
          console.log("Tour: Navigating to /calendar");
          navigate("/calendar");
        }
        break;
    }
  };

  const advanceStage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let nextStage: OnboardingStage;
    switch (stage) {
      case "welcome":
        nextStage = "events";
        break;
      case "events":
        nextStage = "homework";
        break;
      case "homework":
        nextStage = "timetable-create";
        break;
      case "timetable-create":
        nextStage = "timetable-features";
        break;
      case "timetable-features":
        nextStage = "completed";
        break;
      default:
        nextStage = "completed";
    }

    setStage(nextStage);
    localStorage.setItem(`onboarding_stage_${user.id}`, nextStage);

    if (nextStage === "completed") {
      localStorage.setItem(`onboarding_completed_${user.id}`, "true");
      onComplete?.();
    }
  };

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;
    console.log("Tour: Joyride callback", { status, action, index, type, stage });

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      console.log("Tour: Tour finished/skipped, advancing stage");
      setRunTour(false);
      advanceStage();
    }
  };
  const eventsOnboardingSteps: Step[] = [
    {
      target: "[data-tour='school-schedule']",
      content:
        "Welcome! Let's start by setting up your school schedule. Try entering an example, like leaving at 08:30 and returning at 15:30. This makes sure Vistari never schedules study sessions during school hours.",
      disableBeacon: true,
      placement: "bottom",
      spotlightPadding: 0,
    },
    {
      target: "[data-tour='add-event']",
      content:
        "Great! Now add another commitment like sports practice or music lessons. Click 'Add Event' and type in one real or example event so you can see how it appears in your timetable.",
      placement: "left",
      spotlightPadding: 20,
    },
    {
      target: "[data-tour='events-list']",
      content:
        "All your events appear here. You can edit or delete them anytime. Once you've added at least one event, click 'Next' to continue to homework.",
      placement: "top",
      spotlightPadding: 20,
    },
  ];

  const homeworkOnboardingSteps: Step[] = [
    {
      target: "[data-tour='add-homework']",
      content: "Perfect! Now let's add your homework assignments. Click 'Add Homework' and enter the subject, title, due date, and estimated duration. Vistari will schedule time to complete them!",
      disableBeacon: true,
      placement: "left",
      spotlightPadding: 20,
    },
    {
      target: "[data-tour='active-homework']",
      content: "Your active homework shows up here, sorted by due date. Add a few assignments, then click 'Next' to create your first AI-powered timetable!",
      placement: "top",
      spotlightPadding: 20,
    },
  ];

  const timetableCreateSteps: Step[] = [
    {
      target: "[data-tour='new-timetable']",
      content: "Excellent! Now for the exciting part - creating your AI-powered study timetable! Click 'New Timetable' and we'll walk you through each step to create the perfect personalized study plan.",
      disableBeacon: true,
      placement: "bottom",
      spotlightPadding: 20,
    },
  ];

  const timetableFeaturesSteps: Step[] = [
    {
      target: "[data-tour='session-card']",
      content: "Amazing! Your timetable is ready. Click on any study session to start a timer. The timer counts down and automatically asks for feedback when you're done.",
      disableBeacon: true,
      placement: "top",
      spotlightPadding: 20,
    },
    {
      target: "[data-tour='calendar-legend']",
      content: "Each color represents a different activity type: Red = events, Blue = revision, Green = homework, Yellow = test prep. This helps you see your day at a glance!",
      placement: "bottom",
      spotlightPadding: 20,
    },
    {
      target: "[data-tour='daily-insights']",
      content: "Check your daily insights panel to see your progress. The AI learns from your feedback and adapts future schedules to match your needs!",
      placement: "left",
      spotlightPadding: 20,
    },
    {
      target: "body",
      content: "Perfect! You're all set to begin your study journey with Vistari. Explore other sections like Social and Groups to connect with friends. Good luck! 🎉",
      placement: "center",
    },
  ];

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      disableScrollParentFix={false}
      scrollOffset={100}
      spotlightClicks={true}
      disableOverlayClose={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--card))",
          overlayColor: "transparent",
          arrowColor: "hsl(var(--card))",
          zIndex: 10000,
        },
        overlay: {
          backgroundColor: "transparent",
        },
        spotlight: {
          borderRadius: "18px",
          backgroundColor: "transparent",
          border: "2px solid rgba(255, 255, 255, 0.4)",
        },
        tooltip: {
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 10px 40px -10px rgba(0, 0, 0, 0.4)",
          fontSize: "15px",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: "18px",
          fontWeight: 700,
          marginBottom: "8px",
        },
        tooltipContent: {
          fontSize: "14px",
          lineHeight: "1.6",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          borderRadius: "10px",
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: 600,
          transition: "all 0.2s ease",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          marginRight: "12px",
          fontSize: "14px",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
          fontSize: "14px",
        },
      }}
      floaterProps={{
        disableAnimation: false,
        hideArrow: false,
        offset: 15,
        placement: "auto",
        styles: {
          floater: {
            filter: "none",
          },
          arrow: {
            length: 12,
            spread: 24,
          },
        },
      }}
    />
  );
};

export default GuidedOnboarding;
