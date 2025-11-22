import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { Subject } from "../OnboardingWizard";

export interface Homework {
  id?: string;
  subject: string;
  title: string;
  description?: string;
  due_date: string;
  duration?: number;
}

interface HomeworkStepProps {
  subjects: Subject[];
  homeworks: Homework[];
  setHomeworks: (homeworks: Homework[]) => void;
}

const HomeworkStep = ({ subjects, homeworks, setHomeworks }: HomeworkStepProps) => {
  const [currentHomework, setCurrentHomework] = useState<Homework>({
    subject: "",
    title: "",
    description: "",
    due_date: "",
    duration: 60,
  });

  const addHomework = () => {
    if (currentHomework.subject && currentHomework.title && currentHomework.due_date) {
      setHomeworks([...homeworks, { ...currentHomework, id: Date.now().toString() }]);
      setCurrentHomework({
        subject: "",
        title: "",
        description: "",
        due_date: "",
        duration: 60,
      });
    }
  };

  const removeHomework = (id: string) => {
    setHomeworks(homeworks.filter(hw => hw.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Select
            value={currentHomework.subject}
            onValueChange={(value) => setCurrentHomework({ ...currentHomework, subject: value })}
          >
            <SelectTrigger id="subject">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id || subject.name} value={subject.name}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Homework Title</Label>
          <Input
            id="title"
            value={currentHomework.title}
            onChange={(e) => setCurrentHomework({ ...currentHomework, title: e.target.value })}
            placeholder="e.g., Biology Essay on Photosynthesis"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={currentHomework.description}
            onChange={(e) => setCurrentHomework({ ...currentHomework, description: e.target.value })}
            placeholder="Additional details about the homework"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="due-date">Due Date</Label>
            <Input
              id="due-date"
              type="date"
              value={currentHomework.due_date}
              onChange={(e) => setCurrentHomework({ ...currentHomework, due_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              value={currentHomework.duration}
              onChange={(e) => setCurrentHomework({ ...currentHomework, duration: parseInt(e.target.value) })}
              placeholder="60"
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={addHomework}
          disabled={!currentHomework.subject || !currentHomework.title || !currentHomework.due_date}
          className="w-full gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          Add Homework
        </Button>
      </div>

      {homeworks.length > 0 && (
        <div className="space-y-2">
          <Label>Added Homework ({homeworks.length})</Label>
          <div className="space-y-2">
            {homeworks.map((hw) => (
              <Card key={hw.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{hw.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {hw.subject} • Due: {new Date(hw.due_date).toLocaleDateString()}
                        {hw.duration && ` • ${hw.duration} mins`}
                      </div>
                      {hw.description && (
                        <div className="text-sm text-muted-foreground mt-1">{hw.description}</div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeHomework(hw.id!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {homeworks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No homework added yet. Add your homework assignments to include them in your timetable.</p>
          <p className="text-sm mt-2">You can skip this step if you don't have any homework.</p>
        </div>
      )}
    </div>
  );
};

export default HomeworkStep;
