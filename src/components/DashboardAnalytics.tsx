import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Loader2, 
  BarChart3,
  Activity,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Timetable {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface Insight {
  strugglingTopics: Array<{
    topic: string;
    subject: string;
    severity: string;
    reason: string;
    quotes: string[];
  }>;
  strongAreas: Array<{
    topic: string;
    subject: string;
    reason: string;
    quotes: string[];
  }>;
  learningPatterns: string[];
  recommendedFocus: string[];
  personalizedTips: string[];
  subjectBreakdown: {
    [key: string]: {
      confidenceScore: number;
      summary: string;
      topicsCount: number;
    };
  };
  overallSummary: string;
}

interface EfficiencyScore {
  score: number;
  rating: string;
  easyCount: number;
  hardCount: number;
  totalReflections: number;
}

export const DashboardAnalytics = ({ userId }: { userId: string }) => {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insight | null>(null);
  const [reflections, setReflections] = useState<any[]>([]);
  const [efficiencyScore, setEfficiencyScore] = useState<EfficiencyScore | null>(null);

  useEffect(() => {
    fetchTimetables();
  }, [userId]);

  useEffect(() => {
    if (selectedTimetableId) {
      fetchReflections();
      fetchExistingInsights();
      calculateEfficiencyScore();
    }
  }, [selectedTimetableId]);

  const fetchTimetables = async () => {
    const { data } = await supabase
      .from("timetables")
      .select("id, name, start_date, end_date")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      setTimetables(data);
      setSelectedTimetableId(data[0].id);
    }
  };

  const fetchReflections = async () => {
    if (!selectedTimetableId) return;

    const { data } = await supabase
      .from("topic_reflections")
      .select("*")
      .eq("timetable_id", selectedTimetableId)
      .eq("user_id", userId);

    setReflections(data || []);
  };

  const fetchExistingInsights = async () => {
    if (!selectedTimetableId) return;

    const { data } = await supabase
      .from("study_insights")
      .select("*")
      .eq("timetable_id", selectedTimetableId)
      .eq("user_id", userId)
      .maybeSingle();

    if (data?.insights_data) {
      setInsights(data.insights_data as unknown as Insight);
    }
  };

  const calculateEfficiencyScore = async () => {
    if (!selectedTimetableId) return;

    const { data } = await supabase
      .from("topic_reflections")
      .select("reflection_data")
      .eq("timetable_id", selectedTimetableId)
      .eq("user_id", userId);

    if (!data || data.length === 0) {
      setEfficiencyScore(null);
      return;
    }

    let easyCount = 0;
    let hardCount = 0;

    data.forEach((reflection) => {
      const reflectionData = reflection.reflection_data as any;
      if (reflectionData?.easyAspects) {
        easyCount += reflectionData.easyAspects.length;
      }
      if (reflectionData?.hardAspects) {
        hardCount += reflectionData.hardAspects.length;
      }
    });

    const total = easyCount + hardCount;
    const ratio = total > 0 ? (easyCount / total) * 100 : 0;
    
    let rating = "Starting Out";
    if (ratio >= 80) rating = "Excellent Retention";
    else if (ratio >= 65) rating = "Strong Understanding";
    else if (ratio >= 50) rating = "Good Progress";
    else if (ratio >= 35) rating = "Building Foundation";

    setEfficiencyScore({
      score: Math.round(ratio),
      rating,
      easyCount,
      hardCount,
      totalReflections: data.length,
    });
  };

  const generateInsights = async () => {
    if (!selectedTimetableId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { timetableId: selectedTimetableId }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setInsights(data.insights);
      toast.success("AI Analysis generated!");
    } catch (error) {
      console.error("Error generating insights:", error);
      toast.error("Failed to generate insights");
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      default: return 'secondary';
    }
  };

  if (timetables.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Create a timetable to see AI-powered study insights
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timetable Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Study Analytics & AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={selectedTimetableId} onValueChange={setSelectedTimetableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a timetable" />
                </SelectTrigger>
                <SelectContent>
                  {timetables.map((tt) => (
                    <SelectItem key={tt.id} value={tt.id}>
                      {tt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={generateInsights}
              disabled={loading || reflections.length === 0}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Analysis
                </>
              )}
            </Button>
          </div>

          {reflections.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Complete study sessions and add reflections to generate AI insights
            </p>
          )}
        </CardContent>
      </Card>

      {/* Study Efficiency Score */}
      {efficiencyScore && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Study Efficiency Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-4xl font-bold text-primary">{efficiencyScore.score}%</div>
                <p className="text-sm text-muted-foreground mt-1">{efficiencyScore.rating}</p>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{efficiencyScore.easyCount} easy aspects</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-orange-600" />
                  <span>{efficiencyScore.hardCount} hard aspects</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Based on {efficiencyScore.totalReflections} reflections
                </div>
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-primary/80 h-full rounded-full transition-all duration-500"
                style={{ width: `${efficiencyScore.score}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This score analyzes how well you're retaining information based on easy vs hard aspects in your reflections
            </p>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {insights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              AI Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Summary */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <p className="text-sm">{insights.overallSummary}</p>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Topic Completion Matrix */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Topic Completion Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[500px] w-full overflow-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(() => {
                            // Build topic completion data from reflections
                            const topicMap: { [key: string]: { subject: string; completed: number; notCompleted: number } } = {};
                            
                            reflections.forEach((ref) => {
                              const data = ref.reflection_data as any;
                              const topicKey = `${ref.subject} - ${ref.topic}`;
                              
                              if (!topicMap[topicKey]) {
                                topicMap[topicKey] = { subject: ref.subject, completed: 0, notCompleted: 0 };
                              }
                              
                              // Count easy aspects as completed, hard aspects as not completed
                              if (data?.easyAspects) {
                                topicMap[topicKey].completed += data.easyAspects.length;
                              }
                              if (data?.hardAspects) {
                                topicMap[topicKey].notCompleted += data.hardAspects.length;
                              }
                            });
                            
                            return Object.entries(topicMap).map(([topic, data]) => ({
                              topic: topic.length > 30 ? topic.substring(0, 30) + '...' : topic,
                              fullTopic: topic,
                              'Already Done': data.completed,
                              'To Do': data.notCompleted,
                            }));
                          })()}
                          layout="vertical"
                          margin={{ top: 20, right: 30, bottom: 20, left: 150 }}
                        >
                          <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <YAxis 
                            dataKey="topic" 
                            type="category" 
                            width={140}
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                return payload[0].payload.fullTopic;
                              }
                              return label;
                            }}
                          />
                          <Legend />
                          <Bar dataKey="Already Done" stackId="a" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="To Do" stackId="a" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Mistake Genome */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Mistake Genome</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={(() => {
                            // Build mistake patterns from hard aspects
                            const mistakeMap: { [key: string]: number } = {};
                            
                            reflections.forEach((ref) => {
                              const data = ref.reflection_data as any;
                              if (data?.hardAspects) {
                                data.hardAspects.forEach((aspect: string) => {
                                  // Categorize mistakes by keywords
                                  let category = 'Other';
                                  if (aspect.toLowerCase().includes('formula') || aspect.toLowerCase().includes('equation')) {
                                    category = 'Formulas';
                                  } else if (aspect.toLowerCase().includes('concept') || aspect.toLowerCase().includes('theory')) {
                                    category = 'Concepts';
                                  } else if (aspect.toLowerCase().includes('problem') || aspect.toLowerCase().includes('question')) {
                                    category = 'Problem Solving';
                                  } else if (aspect.toLowerCase().includes('memory') || aspect.toLowerCase().includes('remember')) {
                                    category = 'Memory';
                                  } else if (aspect.toLowerCase().includes('calculation') || aspect.toLowerCase().includes('math')) {
                                    category = 'Calculations';
                                  } else if (aspect.toLowerCase().includes('application') || aspect.toLowerCase().includes('apply')) {
                                    category = 'Application';
                                  }
                                  
                                  mistakeMap[category] = (mistakeMap[category] || 0) + 1;
                                });
                              }
                            });
                            
                            return Object.entries(mistakeMap)
                              .map(([category, count]) => ({
                                category,
                                mistakes: count,
                              }))
                              .sort((a, b) => b.mistakes - a.mistakes);
                          })()}
                          margin={{ top: 20, right: 30, bottom: 60, left: 40 }}
                        >
                          <XAxis 
                            dataKey="category" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                          />
                          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar 
                            dataKey="mistakes" 
                            fill="hsl(var(--destructive))" 
                            radius={[8, 8, 0, 0]}
                            name="Difficulty Count"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                {/* Subject Performance Bar Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Subject Performance Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={Object.entries(insights.subjectBreakdown).reduce((acc, [subject], idx) => ({
                        ...acc,
                        [subject]: {
                          label: subject,
                          color: `hsl(var(--chart-${(idx % 5) + 1}))`,
                        }
                      }), {})}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Object.entries(insights.subjectBreakdown).map(([subject, data]) => ({
                          subject,
                          score: data.confidenceScore,
                          topics: data.topicsCount,
                        }))}>
                          <XAxis dataKey="subject" />
                          <YAxis domain={[0, 10]} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar dataKey="score" name="Confidence Score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    
                    <div className="mt-4 space-y-2">
                      {Object.entries(insights.subjectBreakdown).map(([subject, data]) => (
                        <div key={subject} className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{subject}</span>
                            <span className="text-muted-foreground">{data.confidenceScore}/10</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{data.summary}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="insights" className="space-y-6">
                {/* Learning Patterns */}
                {insights.learningPatterns.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Learning Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {insights.learningPatterns.map((pattern, idx) => (
                          <li key={idx} className="text-sm flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{pattern}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Recommended Focus */}
                {insights.recommendedFocus.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Recommended Focus Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {insights.recommendedFocus.map((focus, idx) => (
                          <li key={idx} className="text-sm flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{focus}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Personalized Tips */}
                {insights.personalizedTips.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Personalized Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {insights.personalizedTips.map((tip, idx) => (
                          <li key={idx} className="text-sm flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
