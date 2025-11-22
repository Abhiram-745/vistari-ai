import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { Subject } from "../OnboardingWizard";

interface SubjectsStepProps {
  subjects: Subject[];
  setSubjects: (subjects: Subject[]) => void;
}

const GCSE_SUBJECTS = [
  "Mathematics",
  "English Language",
  "English Literature",
  "Biology",
  "Chemistry",
  "Physics",
  "Combined Science",
  "History",
  "Geography",
  "French",
  "Spanish",
  "German",
  "Computer Science",
  "Business Studies",
  "Economics",
  "Psychology",
  "Sociology",
  "Religious Studies",
  "Art & Design",
  "Drama",
  "Music",
  "Physical Education",
  "Food Technology",
  "Design & Technology",
];

const EXAM_BOARDS = [
  "AQA",
  "Edexcel",
  "OCR",
  "WJEC",
  "CCEA",
  "Eduqas",
];

const SubjectsStep = ({ subjects, setSubjects }: SubjectsStepProps) => {
  const [subjectName, setSubjectName] = useState("");
  const [examBoard, setExamBoard] = useState("");

  const addSubject = () => {
    if (subjectName.trim() && examBoard.trim()) {
      setSubjects([...subjects, { 
        id: crypto.randomUUID(),
        name: subjectName, 
        exam_board: examBoard 
      }]);
      setSubjectName("");
      setExamBoard("");
    }
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject-name">Subject</Label>
          <Select value={subjectName} onValueChange={setSubjectName}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select a subject" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {GCSE_SUBJECTS.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="exam-board">Exam Board</Label>
          <Select value={examBoard} onValueChange={setExamBoard}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Select exam board" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {EXAM_BOARDS.map((board) => (
                <SelectItem key={board} value={board}>
                  {board}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="button"
        onClick={addSubject}
        disabled={!subjectName.trim() || !examBoard.trim()}
        className="w-full bg-gradient-secondary hover:opacity-90"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Subject
      </Button>

      {subjects.length > 0 && (
        <div className="space-y-2">
          <Label>Your Subjects ({subjects.length})</Label>
          <div className="space-y-2">
            {subjects.map((subject, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div>
                  <p className="font-medium">{subject.name}</p>
                  <p className="text-sm text-muted-foreground">{subject.exam_board}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSubject(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectsStep;
