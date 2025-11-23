import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { HomeworkList } from "@/components/HomeworkList";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Homework = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    } else {
      navigate("/auth");
    }
  };

  return (
    <>
      <AppSidebar />
      
      <div className="flex-1 flex flex-col min-h-screen w-full bg-gradient-to-br from-background via-muted/50 to-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
              Homework & Assignments
            </h1>
            <p className="text-muted-foreground">
              Track your homework assignments and deadlines. These will be included in your study timetables.
            </p>
          </div>

          {userId && <HomeworkList userId={userId} />}
        </main>
      </div>
    </>
  );
};

export default Homework;
