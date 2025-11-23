import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { startOfWeek, format } from "date-fns";

interface WeeklyGoalsWidgetProps {
  userId: string;
}

export const WeeklyGoalsWidget = ({ userId }: WeeklyGoalsWidgetProps) => {
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [targetHours, setTargetHours] = useState("");

  useEffect(() => {
    fetchWeeklyGoal();
  }, [userId]);

  const fetchWeeklyGoal = async () => {
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(new Date(), "yyyy-MM-dd");
    
    // Fetch weekly goal
    const { data: goalData, error: goalError } = await supabase
      .from("weekly_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("week_start", weekStart)
      .maybeSingle();

    // Fetch actual study hours from completed sessions this week
    const { data: streakData, error: streakError } = await supabase
      .from("study_streaks")
      .select("minutes_studied")
      .eq("user_id", userId)
      .gte("date", weekStart)
      .lte("date", weekEnd);

    if (goalError) {
      console.error("Error fetching goal:", goalError);
    }

    if (!streakError && streakData) {
      const totalMinutes = streakData.reduce((sum, record) => sum + record.minutes_studied, 0);
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal

      if (goalData) {
        // Update current_hours in the goal if different
        if (goalData.current_hours !== totalHours) {
          await supabase
            .from("weekly_goals")
            .update({ current_hours: totalHours })
            .eq("id", goalData.id);
          
          setGoal({ ...goalData, current_hours: totalHours });
        } else {
          setGoal(goalData);
        }
      } else {
        setGoal(null);
      }
    } else {
      setGoal(goalData);
    }
    
    setLoading(false);
  };

  const createOrUpdateGoal = async () => {
    const hours = parseInt(targetHours);
    if (isNaN(hours) || hours < 1 || hours > 100) {
      toast.error("Please enter a valid number of hours (1-100)");
      return;
    }

    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

    if (goal) {
      // Update existing goal
      const { error } = await supabase
        .from("weekly_goals")
        .update({ target_hours: hours })
        .eq("id", goal.id);

      if (error) {
        toast.error("Failed to update goal");
      } else {
        toast.success("Goal updated!");
        setIsEditing(false);
        fetchWeeklyGoal();
      }
    } else {
      // Create new goal
      const { error } = await supabase
        .from("weekly_goals")
        .insert({
          user_id: userId,
          week_start: weekStart,
          target_hours: hours,
          current_hours: 0,
        });

      if (error) {
        toast.error("Failed to create goal");
      } else {
        toast.success("Goal set!");
        setIsEditing(false);
        fetchWeeklyGoal();
      }
    }
    setTargetHours("");
  };

  const progressPercentage = goal
    ? Math.min((goal.current_hours / goal.target_hours) * 100, 100)
    : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">Loading goals...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-5 w-5 text-primary" />
            </div>
            Weekly Goal
          </div>
          {goal && !isEditing && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setIsEditing(true);
                setTargetHours(goal.target_hours.toString());
              }}
              className="hover:bg-primary/10"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!goal && !isEditing ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl">🎯</div>
            <p className="text-muted-foreground">
              Set a weekly study hour goal to track your progress!
            </p>
            <Button onClick={() => setIsEditing(true)} className="gap-2 bg-gradient-primary">
              <Plus className="h-4 w-4" />
              Set Weekly Goal
            </Button>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Target Study Hours This Week</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
                placeholder="e.g. 10"
                className="text-lg h-12"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createOrUpdateGoal} className="flex-1 gap-2 bg-gradient-primary">
                <Check className="h-4 w-4" />
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setTargetHours("");
                }}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center space-y-3">
              <div className="relative">
                <div className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {goal.current_hours}
                  <span className="text-muted-foreground text-3xl font-normal"> / {goal.target_hours}h</span>
                </div>
              </div>
              <Progress value={progressPercentage} className="h-4 bg-muted" />
              <p className="text-sm font-semibold text-muted-foreground">
                {Math.round(progressPercentage)}% Complete
              </p>
            </div>

            {progressPercentage >= 100 ? (
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30">
                <p className="text-2xl mb-1">🎉</p>
                <p className="text-lg font-bold text-primary">Goal Achieved!</p>
                <p className="text-sm text-muted-foreground mt-1">Amazing work this week!</p>
              </div>
            ) : (
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="font-semibold text-foreground">
                  {(goal.target_hours - goal.current_hours).toFixed(1)} hours remaining
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  this week
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
