import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Sparkles, TrendingUp, TrendingDown, Lightbulb, Target, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
            <Brain className="h-5 w-5 text-primary" />
            Your Study Mindprint
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
                  Do Mindprint
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

                  {/* Subject Breakdown */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Subject Confidence
                    </h3>
                    {Object.entries(insights.subjectBreakdown).map(([subject, data]) => (
                      <div key={subject} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{subject}</span>
                          <span className="text-sm text-muted-foreground">
                            {data.confidenceScore}/10
                          </span>
                        </div>
                        <Progress value={data.confidenceScore * 10} />
                        <p className="text-xs text-muted-foreground">{data.summary}</p>
                      </div>
                    ))}
                  </div>

                  {/* Struggling Topics */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      Topics Needing Focus
                    </h3>
                    <div className="space-y-2">
                      {insights.strugglingTopics.map((topic, idx) => (
                        <div
                          key={idx}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setSelectedTopic(topic.topic)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{topic.topic}</span>
                                <Badge variant={getSeverityColor(topic.severity) as any} className="text-xs">
                                  {topic.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{topic.subject}</p>
                              <p className="text-sm mt-2">{topic.reason}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strong Areas */}
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Your Strengths
                    </h3>
                    <div className="space-y-2">
                      {insights.strongAreas.map((area, idx) => (
                        <div
                          key={idx}
                          className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors bg-green-50 dark:bg-green-950/20"
                          onClick={() => setSelectedTopic(area.topic)}
                        >
                          <div className="font-medium text-sm">{area.topic}</div>
                          <p className="text-xs text-muted-foreground">{area.subject}</p>
                          <p className="text-sm mt-2">{area.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Personalized Tips */}
                  <Accordion type="single" collapsible>
                    <AccordionItem value="tips">
                      <AccordionTrigger className="text-sm font-semibold">
                        <span className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-600" />
                          Personalized Study Tips
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm">
                          {insights.personalizedTips.map((tip, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="patterns">
                      <AccordionTrigger className="text-sm font-semibold">
                        Learning Patterns Detected
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm">
                          {insights.learningPatterns.map((pattern, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <span>{pattern}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="focus">
                      <AccordionTrigger className="text-sm font-semibold">
                        Recommended Focus Areas
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm">
                          {insights.recommendedFocus.map((focus, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-primary">•</span>
                              <span>{focus}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                  </AccordionItem>
                </Accordion>
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
