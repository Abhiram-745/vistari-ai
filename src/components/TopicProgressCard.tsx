import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TopicProgress, 
  getMasteryColor, 
  getMasteryLabel 
} from "@/hooks/useTopicProgress";
import { Trophy, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface TopicProgressCardProps {
  progress: TopicProgress;
  topicName: string;
}

export const TopicProgressCard = ({ progress, topicName }: TopicProgressCardProps) => {
  const successRate = progress.total_sessions_count > 0
    ? Math.round((progress.successful_sessions_count / progress.total_sessions_count) * 100)
    : 0;

  const isDueForReview = progress.next_review_date && 
    new Date(progress.next_review_date) <= new Date();

  return (
    <Card className={isDueForReview ? "border-primary" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold">{topicName}</CardTitle>
          <Badge 
            variant="outline" 
            className={`${getMasteryColor(progress.mastery_level)} border`}
          >
            <Trophy className="w-3 h-3 mr-1" />
            {getMasteryLabel(progress.mastery_level)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold">{progress.progress_percentage}%</span>
          </div>
          <Progress value={progress.progress_percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <CheckCircle2 className="w-3 h-3" />
              <span>Sessions</span>
            </div>
            <p className="font-semibold">
              {progress.successful_sessions_count}/{progress.total_sessions_count} successful
            </p>
            <p className="text-xs text-muted-foreground">
              {successRate}% success rate
            </p>
          </div>

          {progress.next_review_date && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Next Review</span>
              </div>
              <p className={`font-semibold ${isDueForReview ? "text-primary" : ""}`}>
                {format(new Date(progress.next_review_date), "MMM d, yyyy")}
              </p>
              {isDueForReview && (
                <p className="text-xs text-primary">Due for review!</p>
              )}
            </div>
          )}
        </div>

        {progress.last_reviewed_at && (
          <p className="text-xs text-muted-foreground">
            Last reviewed: {format(new Date(progress.last_reviewed_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
