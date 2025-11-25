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
      updateTourForStage();
    }
  }, [stage, location.pathname]);

  const checkOnboardingStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const savedStage = localStorage.getItem(`onboarding_stage_${user.id}`);
    if (savedStage && savedStage !== "completed") {
      setStage(savedStage as OnboardingStage);
    } else if (!savedStage) {
      // Start at events stage by default
      setStage("events");
      localStorage.setItem(`onboarding_stage_${user.id}`, "events");
    }
  };

  const updateTourForStage = () => {
    switch (stage) {
      case "events":
        if (location.pathname === "/events") {
          setSteps(eventsOnboardingSteps);
          setRunTour(true);
        } else {
          navigate("/events");
        }
        break;
      case "homework":
        if (location.pathname === "/homework") {
          setSteps(homeworkOnboardingSteps);
          setRunTour(true);
        } else {
          navigate("/homework");
        }
        break;
      case "timetable-create":
        if (location.pathname === "/timetables") {
          setSteps(timetableCreateSteps);
          setRunTour(true);
        } else {
          navigate("/timetables");
        }
        break;
      case "timetable-features":
        if (location.pathname === "/calendar") {
          setSteps(timetableFeaturesSteps);
          setRunTour(true);
        } else {
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

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      advanceStage();
    }
  };

  const eventsOnboardingSteps: Step[] = [
    {
      target: "[data-tour='events-page']",
      content: "Welcome to Events! Let's start by setting up your schedule. This helps Vistari know when you're busy so it won't schedule study sessions during these times.",
      disableBeacon: true,
      placement: "center",
    },
    {
      target: "[data-tour='school-schedule']",
      content: "First, set your school hours. Click here to tell Vistari when you leave for school and when you get back home.",
      placement: "bottom",
    },
    {
      target: "[data-tour='add-event']",
      content: "Now add any recurring events like sports practice, music lessons, or clubs. Click 'Add Event' and fill in the details.",
      placement: "bottom",
    },
    {
      target: "[data-tour='events-list']",
      content: "All your events will appear here. You can edit or delete them anytime. Once you've added at least one event, click 'Next' to continue!",
      placement: "top",
    },
  ];

  const homeworkOnboardingSteps: Step[] = [
    {
      target: "[data-tour='homework-page']",
      content: "Great job! Now let's add your homework assignments. Vistari will automatically schedule time to complete them before the due dates.",
      disableBeacon: true,
      placement: "center",
    },
    {
      target: "[data-tour='add-homework']",
      content: "Click 'Add Homework' to get started. Enter the subject, title, due date, and how long you think it will take.",
      placement: "bottom",
    },
    {
      target: "[data-tour='active-homework']",
      content: "Your active homework will show up here, sorted by due date. Add a few assignments, then click 'Next' to create your first timetable!",
      placement: "top",
    },
  ];

  const timetableCreateSteps: Step[] = [
    {
      target: "[data-tour='timetables-page']",
      content: "Excellent! Now for the exciting part - creating your personalized AI-powered study timetable!",
      disableBeacon: true,
      placement: "center",
    },
    {
      target: "[data-tour='new-timetable']",
      content: "Click here to start the timetable creation wizard. We'll walk you through each step to create the perfect study plan. Take your time filling in all the details!",
      placement: "bottom",
    },
  ];

  const timetableFeaturesSteps: Step[] = [
    {
      target: "[data-tour='calendar-page']",
      content: "Amazing! Your timetable is ready. Let's explore the powerful features that make Vistari special.",
      disableBeacon: true,
      placement: "center",
    },
    {
      target: "[data-tour='session-card']",
      content: "Click on any study session to start a timer. The timer will count down and automatically prompt you for feedback when done.",
      placement: "top",
    },
    {
      target: "[data-tour='calendar-legend']",
      content: "Each color represents a different type of activity. Red = events, Blue = revision, Green = homework, Yellow = test prep.",
      placement: "bottom",
    },
    {
      target: "[data-tour='daily-insights']",
      content: "Check your daily insights to see how you're progressing. The AI analyzes your feedback to improve future schedules.",
      placement: "left",
    },
    {
      target: "body",
      content: "That's it! You're all set to start your study journey. Context-sensitive tours for other sections (Social, Groups, etc.) will appear when you visit them. Good luck!",
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
      spotlightClicks
      disableOverlayClose
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--card))",
          overlayColor: "rgba(0, 0, 0, 0.85)",
          arrowColor: "hsl(var(--card))",
          zIndex: 10000,
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.85)",
        },
        spotlight: {
          borderRadius: "12px",
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85), 0 0 20px 4px hsl(var(--primary) / 0.5)",
        },
        tooltip: {
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 20px 60px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px hsl(var(--border))",
          fontSize: "15px",
          background: "hsl(var(--card))",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: "18px",
          fontWeight: 700,
          marginBottom: "12px",
          color: "hsl(var(--foreground))",
        },
        tooltipContent: {
          fontSize: "15px",
          lineHeight: "1.7",
          color: "hsl(var(--muted-foreground))",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          borderRadius: "10px",
          padding: "12px 24px",
          fontSize: "14px",
          fontWeight: 600,
          transition: "all 0.2s ease",
          border: "none",
          color: "white",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          marginRight: "12px",
          fontSize: "14px",
          padding: "12px 20px",
          border: "1px solid hsl(var(--border))",
          borderRadius: "10px",
          background: "transparent",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
          fontSize: "14px",
          padding: "12px 20px",
        },
      }}
      floaterProps={{
        disableAnimation: false,
        styles: {
          arrow: {
            length: 16,
            spread: 28,
          },
          floater: {
            filter: "drop-shadow(0 10px 30px rgba(0, 0, 0, 0.3))",
          },
        },
      }}
    />
  );
};

export default GuidedOnboarding;
