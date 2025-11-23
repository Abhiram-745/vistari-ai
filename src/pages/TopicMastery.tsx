import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/Header";
import { TopicProgressList } from "@/components/TopicProgressList";
import { SpacedRepetitionPanel } from "@/components/SpacedRepetitionPanel";
import { Trophy, TrendingUp, Target } from "lucide-react";
import { useTopicProgress } from "@/hooks/useTopicProgress";

const TopicMastery = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>();
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const { data: allProgress = [] } = useTopicProgress(userId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchSubjects(session.user.id);
      } else {
        navigate("/auth");
      }
    });
  }, [navigate]);

  const fetchSubjects = async (userId: string) => {
    const { data } = await supabase
      .from("subjects")
      .select("id, name")
      .eq("user_id", userId)
      .order("name");

    if (data && data.length > 0) {
      setSubjects(data);
      setSelectedSubject(data[0].id);
    }
  };

  const calculateOverallStats = () => {
    if (allProgress.length === 0) {
      return { avgProgress: 0, masteryCount: 0, totalTopics: 0 };
    }

    const avgProgress = Math.round(
      allProgress.reduce((sum, p) => sum + p.progress_percentage, 0) / allProgress.length
    );
    const masteryCount = allProgress.filter(p => p.mastery_level === "mastery").length;

    return {
      avgProgress,
      masteryCount,
      totalTopics: allProgress.length,
    };
  };

  const stats = calculateOverallStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Topic Mastery
              </h1>
              <p className="text-muted-foreground mt-2">
                Track your progress and master every topic
              </p>
            </div>
          </div>

          {/* Overall Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgProgress}%</div>
                <p className="text-xs text-muted-foreground">
                  Across {stats.totalTopics} topics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mastered Topics</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.masteryCount}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalTopics > 0 
                    ? Math.round((stats.masteryCount / stats.totalTopics) * 100)
                    : 0}% of all topics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Topics</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTopics}</div>
                <p className="text-xs text-muted-foreground">
                  Being tracked
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Spaced Repetition Panel */}
          <SpacedRepetitionPanel />

          {/* Topics by Subject */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Topics by Subject</CardTitle>
                  <CardDescription>
                    View progress for each topic in your subjects
                  </CardDescription>
                </div>
                {subjects.length > 0 && (
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No subjects found. Create a timetable to start tracking topics!</p>
                  <Button
                    onClick={() => navigate("/")}
                    variant="outline"
                    className="mt-4"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : selectedSubject ? (
                <TopicProgressList subjectId={selectedSubject} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a subject to view topic progress
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TopicMastery;
