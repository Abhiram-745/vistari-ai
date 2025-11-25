import { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS, ACTIONS } from "react-joyride";
import { supabase } from "@/integrations/supabase/client";

interface ProductTourProps {
  tourKey: string;
  steps: Step[];
  onComplete?: () => void;
  run?: boolean;
}

const ProductTour = ({ tourKey, steps, onComplete, run = false }: ProductTourProps) => {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    if (run) {
      checkTourStatus();
    }
  }, [run, tourKey]);

  const checkTourStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user has completed this tour
    const completedTours = localStorage.getItem(`tour_completed_${user.id}`) || "{}";
    const tourStatus = JSON.parse(completedTours);

    if (!tourStatus[tourKey]) {
      setRunTour(true);
    }
  };

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, action } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Mark tour as completed
        const completedTours = localStorage.getItem(`tour_completed_${user.id}`) || "{}";
        const tourStatus = JSON.parse(completedTours);
        tourStatus[tourKey] = true;
        localStorage.setItem(`tour_completed_${user.id}`, JSON.stringify(tourStatus));
      }
      
      setRunTour(false);
      onComplete?.();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--card))",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          arrowColor: "hsl(var(--card))",
          zIndex: 1000,
        },
        tooltip: {
          borderRadius: "12px",
          padding: "20px",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "14px",
          fontWeight: 600,
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          marginRight: "10px",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
        },
      }}
    />
  );
};

export default ProductTour;
