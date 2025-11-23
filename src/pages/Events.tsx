import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import { EventsWidget } from "@/components/EventsWidget";

const Events = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Events & Commitments</h1>
          <p className="text-muted-foreground">
            Manage your events and commitments. These will be considered when generating your study timetables.
          </p>
        </div>

        <EventsWidget />
      </div>
    </div>
  );
};

export default Events;
