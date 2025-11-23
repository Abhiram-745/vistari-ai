import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { EventsWidget } from "@/components/EventsWidget";

const Events = () => {
  const navigate = useNavigate();

  return (
    <>
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen w-full bg-gradient-to-br from-background via-muted/50 to-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
              Events & Commitments
            </h1>
            <p className="text-muted-foreground">
              Manage your events and commitments. These will be considered when generating your study timetables.
            </p>
          </div>

          <EventsWidget />
        </main>
      </div>
    </>
  );
};

export default Events;
