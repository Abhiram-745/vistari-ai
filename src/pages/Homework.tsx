import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Homework & Assignments</h1>
          <p className="text-muted-foreground">
            Track your homework assignments and deadlines. These will be included in your study timetables.
          </p>
        </div>

        {userId && <HomeworkList userId={userId} />}
      </div>
    </div>
  );
};

export default Homework;
