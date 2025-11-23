import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, TrendingUp, TrendingDown, Lightbulb, Target, Loader2, Clock, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
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

interface StudyInsightsPanelProps {
  timetableId: string;
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

export const StudyInsightsPanel = ({ timetableId }: StudyInsightsPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insight | null>(null);
  const [reflections, setReflections] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    fetchReflections();
    fetchExistingInsights();
  }, [timetableId]);

  const fetchReflections = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("topic_reflections")
      .select("*")
      .eq("timetable_id", timetableId)
      .eq("user_id", user.id);

    setReflections(data || []);
  };

  const fetchExistingInsights = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("study_insights")
      .select("*")
      .eq("timetable_id", timetableId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (data?.insights_data) {
      setInsights(data.insights_data as unknown as Insight);
    }
  };

  const generateInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { timetableId }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setInsights(data.insights);
      toast.success("AI Insights generated!");
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

  const selectedReflection = selectedTopic 
    ? reflections.find(r => r.topic === selectedTopic)
    : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            AI Overall Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {reflections.length === 0 
                ? "Complete study sessions and add reflections to generate AI insights!"
                : `${reflections.length} reflections recorded`
              }
            </p>
            <Button
              onClick={generateInsights}
              disabled={loading || reflections.length === 0}
              className="gap-2"
              size="sm"
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

          {reflections.length === 0 ? null : (
            <>

              {insights && (
                <div className="space-y-6 pt-4 border-t">
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
                      {/* Subject Confidence Radar Chart */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Subject Confidence Map
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[350px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart 
                                data={Object.entries(insights.subjectBreakdown).map(([subject, data]) => ({
                                  subject: subject.length > 15 ? subject.substring(0, 15) + '...' : subject,
                                  fullSubject: subject,
                                  confidence: data.confidenceScore,
                                }))}
                                margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                              >
                                <PolarGrid strokeDasharray="3 3" />
                                <PolarAngleAxis 
                                  dataKey="subject" 
                                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                                />
                                <PolarRadiusAxis 
                                  angle={90} 
                                  domain={[0, 10]}
                                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                />
                                <Radar
                                  name="Confidence Level"
                                  dataKey="confidence"
                                  stroke="hsl(var(--primary))"
                                  fill="hsl(var(--primary))"
                                  fillOpacity={0.5}
                                  strokeWidth={2}
                                />
                                <Tooltip 
                                  contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                  }}
                                  formatter={(value: any, name: any, props: any) => [
                                    `${value}/10`,
                                    props.payload.fullSubject || 'Confidence'
                                  ]}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Topics Performance Table */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Topics Performance
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Topics Needing Focus */}
                            {insights.strugglingTopics.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                  <TrendingDown className="h-4 w-4 text-destructive" />
                                  Needs Focus ({insights.strugglingTopics.length})
                                </h4>
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-muted/50">
                                      <tr>
                                        <th className="text-left p-3 text-xs font-medium">Topic</th>
                                        <th className="text-left p-3 text-xs font-medium">Subject</th>
                                        <th className="text-left p-3 text-xs font-medium">Priority</th>
                                        <th className="text-left p-3 text-xs font-medium">Issue</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {insights.strugglingTopics.map((topic, idx) => (
                                        <tr 
                                          key={idx}
                                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                                          onClick={() => setSelectedTopic(topic.topic)}
                                        >
                                          <td className="p-3 text-sm font-medium">{topic.topic}</td>
                                          <td className="p-3 text-sm text-muted-foreground">{topic.subject}</td>
                                          <td className="p-3">
                                            <Badge variant={getSeverityColor(topic.severity) as any} className="text-xs">
                                              {topic.severity}
                                            </Badge>
                                          </td>
                                          <td className="p-3 text-sm text-muted-foreground max-w-md truncate">
                                            {topic.reason}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Strong Topics */}
                            {insights.strongAreas.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  Strengths ({insights.strongAreas.length})
                                </h4>
                                <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-green-50 dark:bg-green-950/20">
                                      <tr>
                                        <th className="text-left p-3 text-xs font-medium">Topic</th>
                                        <th className="text-left p-3 text-xs font-medium">Subject</th>
                                        <th className="text-left p-3 text-xs font-medium">Why You Excel</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {insights.strongAreas.map((area, idx) => (
                                        <tr 
                                          key={idx}
                                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                                          onClick={() => setSelectedTopic(area.topic)}
                                        >
                                          <td className="p-3 text-sm font-medium">{area.topic}</td>
                                          <td className="p-3 text-sm text-muted-foreground">{area.subject}</td>
                                          <td className="p-3 text-sm text-muted-foreground max-w-md truncate">
                                            {area.reason}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {insights.strugglingTopics.length === 0 && insights.strongAreas.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-8">
                                No topic performance data available yet
                              </p>
                            )}
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

                      {/* Struggling vs Strong Topics */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-destructive" />
                              Topics Needing Focus
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {insights.strugglingTopics.map((topic, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                  onClick={() => setSelectedTopic(topic.topic)}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{topic.topic}</span>
                                    <Badge variant={getSeverityColor(topic.severity) as any} className="text-xs">
                                      {topic.severity}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground">{topic.subject}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              Your Strengths
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {insights.strongAreas.map((area, idx) => (
                                <div
                                  key={idx}
                                  className="p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors bg-green-50 dark:bg-green-950/20"
                                  onClick={() => setSelectedTopic(area.topic)}
                                >
                                  <div className="font-medium text-sm">{area.topic}</div>
                                  <p className="text-xs text-muted-foreground">{area.subject}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    <TabsContent value="insights" className="space-y-4">
                      {/* Personalized Tips */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-yellow-600" />
                            Personalized Study Tips
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {insights.personalizedTips.map((tip, idx) => (
                              <li key={idx} className="flex gap-2 p-2 rounded bg-muted/50">
                                <span className="text-primary mt-1">•</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Learning Patterns */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Brain className="h-4 w-4" />
                            Learning Patterns Detected
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {insights.learningPatterns.map((pattern, idx) => (
                              <li key={idx} className="flex gap-2 p-2 rounded bg-muted/50">
                                <span className="text-primary mt-1">•</span>
                                <span>{pattern}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Recommended Focus */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Recommended Focus Areas
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {insights.recommendedFocus.map((focus, idx) => (
                              <li key={idx} className="flex gap-2 p-2 rounded bg-muted/50">
                                <span className="text-primary mt-1">•</span>
                                <span>{focus}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Topic Detail */}
      {selectedTopic && selectedReflection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your Notes: {selectedTopic}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedReflection.reflection_data.easyAspects?.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Easy Aspects:</h4>
                <div className="space-y-2">
                  {selectedReflection.reflection_data.easyAspects.map((item: any, idx: number) => (
                    <div key={idx}>
                      {item.type === "text" ? (
                        <p className="text-sm bg-muted p-2 rounded">{item.content}</p>
                      ) : (
                        <img src={item.content} alt="Note" className="rounded max-h-32" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReflection.reflection_data.hardAspects?.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Challenging Aspects:</h4>
                <div className="space-y-2">
                  {selectedReflection.reflection_data.hardAspects.map((item: any, idx: number) => (
                    <div key={idx}>
                      {item.type === "text" ? (
                        <p className="text-sm bg-muted p-2 rounded">{item.content}</p>
                      ) : (
                        <img src={item.content} alt="Note" className="rounded max-h-32" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReflection.reflection_data.generalNotes?.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">General Notes:</h4>
                <div className="space-y-2">
                  {selectedReflection.reflection_data.generalNotes.map((item: any, idx: number) => (
                    <div key={idx}>
                      {item.type === "text" ? (
                        <p className="text-sm bg-muted p-2 rounded">{item.content}</p>
                      ) : (
                        <img src={item.content} alt="Note" className="rounded max-h-32" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReflection.reflection_data.overallFeeling && (
              <div>
                <h4 className="font-medium text-sm mb-2">Overall Feeling:</h4>
                <p className="text-sm bg-muted p-2 rounded">
                  {selectedReflection.reflection_data.overallFeeling}
                </p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedTopic(null)}
              className="w-full"
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
