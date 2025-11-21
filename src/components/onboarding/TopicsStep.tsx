import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus, ChevronLeft, ChevronRight, Sparkles, Loader2 } from "lucide-react";
import { Subject, Topic } from "../OnboardingWizard";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TopicsStepProps {
  subjects: Subject[];
  topics: Topic[];
  setTopics: (topics: Topic[]) => void;
}

const TopicsStep = ({ subjects, topics, setTopics }: TopicsStepProps) => {
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [topicName, setTopicName] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [confidence, setConfidence] = useState("3");
  const [pastedText, setPastedText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const currentSubject = subjects[currentSubjectIndex];
  const currentSubjectId = currentSubjectIndex.toString();

  const addTopic = () => {
    if (topicName.trim()) {
      setTopics([
        ...topics,
        {
          subject_id: currentSubjectId,
          name: topicName,
          difficulty,
          confidence_level: parseInt(confidence),
        },
      ]);
      setTopicName("");
    }
  };

  const goToNextSubject = () => {
    if (currentSubjectIndex < subjects.length - 1) {
      setCurrentSubjectIndex(currentSubjectIndex + 1);
      setTopicName("");
    }
  };

  const goToPreviousSubject = () => {
    if (currentSubjectIndex > 0) {
      setCurrentSubjectIndex(currentSubjectIndex - 1);
      setTopicName("");
      setPastedText("");
    }
  };

  const parseWithAI = async () => {
    if (!pastedText.trim()) {
      toast.error("Please paste some content first");
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-topics', {
        body: { text: pastedText, subjectName: currentSubject.name }
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.topics && Array.isArray(data.topics)) {
        const newTopics = data.topics.map((t: any) => ({
          subject_id: currentSubjectId,
          name: t.name,
          difficulty: t.difficulty,
          confidence_level: t.confidence_level
        }));
        setTopics([...topics, ...newTopics]);
        setPastedText("");
        toast.success(`Added ${newTopics.length} topics!`);
      }
    } catch (error) {
      console.error('Parse error:', error);
      toast.error("Failed to parse topics. Please try again.");
    } finally {
      setIsParsing(false);
    }
  };

  const removeTopic = (index: number) => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find((s, i) => i.toString() === subjectId);
    return subject?.name || "";
  };

  const currentSubjectTopics = topics.filter(t => t.subject_id === currentSubjectId);

  return (
    <div className="space-y-6">
      {/* Subject Navigation Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              Subject {currentSubjectIndex + 1} of {subjects.length}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToPreviousSubject}
              disabled={currentSubjectIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={goToNextSubject}
              disabled={currentSubjectIndex === subjects.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-primary">{currentSubject.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Add topics you're studying in this subject
          </p>
        </div>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="ai">
            <Sparkles className="h-4 w-4 mr-2" />
            AI Parse
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4 mt-4">

        <div className="space-y-2">
          <Label htmlFor="topic-name">Topic Name</Label>
          <Input
            id="topic-name"
            placeholder="e.g., Quadratic Equations"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addTopic()}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confidence">Confidence (1-5)</Label>
            <Select value={confidence} onValueChange={setConfidence}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((n) => (
                  <SelectItem key={n} value={n.toString()}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          type="button"
          onClick={addTopic}
          disabled={!topicName.trim()}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Topic to {currentSubject.name}
        </Button>
      </TabsContent>

      <TabsContent value="ai" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="paste-text">Paste Your Checklist or Notes</Label>
          <Textarea
            id="paste-text"
            placeholder={`Paste your ${currentSubject.name} topics here...\n\nExample:\n- Quadratic equations\n- Pythagoras theorem\n- Circle theorems\n- Trigonometry`}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={8}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            AI will automatically extract topics, assess difficulty, and estimate confidence levels
          </p>
        </div>

        <Button
          type="button"
          onClick={parseWithAI}
          disabled={!pastedText.trim() || isParsing}
          className="w-full bg-gradient-primary hover:opacity-90"
        >
          {isParsing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Parsing Topics...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Parse with AI
            </>
          )}
        </Button>
      </TabsContent>
    </Tabs>

      {currentSubjectTopics.length > 0 && (
        <div className="space-y-2">
          <Label>Topics in {currentSubject.name} ({currentSubjectTopics.length})</Label>
          <div className="space-y-2">
            {topics.filter(t => t.subject_id === currentSubjectId).map((topic, index) => {
              const originalIndex = topics.indexOf(topic);
              return (
                <div
                  key={originalIndex}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{topic.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {topic.difficulty} • Confidence: {topic.confidence_level}/5
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTopic(originalIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicsStep;
