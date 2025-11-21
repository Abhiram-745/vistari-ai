import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { Subject, Topic } from "../OnboardingWizard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DifficultTopicsStepProps {
  subjects: Subject[];
  topics: Topic[];
  onAnalysisComplete: (analysis: any) => void;
}

const DifficultTopicsStep = ({ subjects, topics, onAnalysisComplete }: DifficultTopicsStepProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const getSubjectName = (subjectId: string) => {
    const index = parseInt(subjectId);
    return subjects[index]?.name || "";
  };

  const analyzeTopics = async () => {
    if (topics.length === 0) {
      toast.error("Please add some topics first");
      return;
    }

    setIsAnalyzing(true);
    try {
      const topicsWithSubjects = topics.map(t => ({
        ...t,
        subject: getSubjectName(t.subject_id)
      }));

      const { data, error } = await supabase.functions.invoke('analyze-difficulty', {
        body: { topics: topicsWithSubjects }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setAnalysis(data);
      onAnalysisComplete(data);
      toast.success("Analysis complete!");
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error("Failed to analyze topics. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!analysis && topics.length > 0) {
      analyzeTopics();
    }
  }, []);

  const getPriorityColor = (score: number) => {
    if (score >= 8) return "destructive";
    if (score >= 5) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">AI Analysis</span>
        </div>
        <h3 className="text-2xl font-bold">Study Priority Analysis</h3>
        <p className="text-muted-foreground">
          AI is analyzing your topics to optimize your study timetable
        </p>
      </div>

      {isAnalyzing && !analysis && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Analyzing {topics.length} topics...</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Difficult Topics Section */}
          {analysis.difficult_topics && analysis.difficult_topics.length > 0 && (
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Difficult Topics (Needs Extra Focus)
                </CardTitle>
                <CardDescription>
                  These topics have been identified as challenging and will receive more study time
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.difficult_topics.map((topic: any, index: number) => (
                  <div key={index} className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-destructive">{topic.topic_name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{topic.reason}</p>
                      </div>
                    </div>
                    <div className="p-3 bg-background/50 rounded border border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Study Suggestion:</p>
                      <p className="text-sm">{topic.study_suggestion}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Priority Scores Section */}
          {analysis.priorities && analysis.priorities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Study Priorities
                </CardTitle>
                <CardDescription>
                  Priority scores help allocate study time effectively (1=low priority, 10=high priority)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.priorities
                  .sort((a: any, b: any) => b.priority_score - a.priority_score)
                  .map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.topic_name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.reasoning}</p>
                      </div>
                      <Badge variant={getPriorityColor(item.priority_score)} className="ml-4">
                        Priority: {item.priority_score}/10
                      </Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 inline mr-2" />
              This analysis will be used to create a smart timetable that allocates more time to challenging topics
            </p>
          </div>
        </div>
      )}

      {!isAnalyzing && !analysis && (
        <Button
          onClick={analyzeTopics}
          className="w-full bg-gradient-primary hover:opacity-90"
          disabled={topics.length === 0}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Analyze Topics
        </Button>
      )}
    </div>
  );
};

export default DifficultTopicsStep;
