import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, Edit2, Save, X, Trophy } from "lucide-react";
import { toast } from "sonner";

interface GroupChallengeProps {
  groupId: string;
  isAdmin: boolean;
}

export const GroupChallenge = ({ groupId, isAdmin }: GroupChallengeProps) => {
  const [challenge, setChallenge] = useState<{ daily_hours_goal: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [goalInput, setGoalInput] = useState<number>(2);
  const [todayHours, setTodayHours] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
    loadTodayProgress();
  }, [groupId]);

  const loadChallenge = async () => {
    try {
      const { data, error } = await supabase
        .from("group_challenges")
        .select("*")
        .eq("group_id", groupId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setChallenge(data);
        setGoalInput(data.daily_hours_goal);
      }
    } catch (error) {
      console.error("Error loading challenge:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTodayProgress = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get all group members
      const { data: members } = await supabase
        .from("group_members")
        .select("user_id")
        .eq("group_id", groupId);

      if (!members || members.length === 0) return;

      const memberIds = members.map(m => m.user_id);

      // Get today's study sessions for all members
      const { data: streaks } = await supabase
        .from("study_streaks")
        .select("minutes_studied")
        .in("user_id", memberIds)
        .eq("date", today);

      const totalMinutes = streaks?.reduce((sum, s) => sum + s.minutes_studied, 0) || 0;
      setTodayHours(totalMinutes / 60);
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const handleSaveGoal = async () => {
    try {
      if (goalInput < 1 || goalInput > 24) {
        toast.error("Goal must be between 1 and 24 hours");
        return;
      }

      const { error } = await supabase
        .from("group_challenges")
        .upsert({
          group_id: groupId,
          daily_hours_goal: goalInput,
        });

      if (error) throw error;

      toast.success("Challenge goal updated!");
      setEditing(false);
      loadChallenge();
    } catch (error) {
      console.error("Error saving goal:", error);
      toast.error("Failed to update goal");
    }
  };

  if (loading) {
    return null;
  }

  const goal = challenge?.daily_hours_goal || 2;
  const progress = (todayHours / goal) * 100;
  const achieved = todayHours >= goal;

  return (
    <Card className={`border-2 ${achieved ? "border-green-500/50" : "border-primary/20"}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Daily Group Challenge
              {achieved && <Trophy className="h-5 w-5 text-green-500 animate-bounce" />}
            </CardTitle>
            <CardDescription>
              {achieved
                ? "🎉 Goal achieved today!"
                : `Study ${goal} hours as a group today`}
            </CardDescription>
          </div>
          {isAdmin && !editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="goal">Daily Hours Goal</Label>
              <Input
                id="goal"
                type="number"
                min="1"
                max="24"
                value={goalInput}
                onChange={(e) => setGoalInput(parseInt(e.target.value) || 2)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveGoal} className="flex-1">
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setGoalInput(goal);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Today's Progress</span>
                <span className="font-semibold">
                  {todayHours.toFixed(1)}h / {goal}h
                </span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-3" />
            </div>
            <p className="text-xs text-muted-foreground">
              Combined study hours from all group members today
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};
