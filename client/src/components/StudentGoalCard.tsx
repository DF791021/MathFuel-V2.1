import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

interface StudentGoalCardProps {
  goal: {
    id: number;
    goalName: string;
    goalType: string;
    targetValue: number;
    currentValue: number;
    progressPercentage: number;
    status: "active" | "completed" | "failed" | "paused";
    priority: "low" | "medium" | "high";
    dueDate: string;
    startDate: string;
    completedDate?: string;
    feedback?: string;
  };
}

export default function StudentGoalCard({ goal }: StudentGoalCardProps) {
  const daysUntilDue = Math.ceil(
    (new Date(goal.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue >= 0 && daysUntilDue <= 7;

  const statusColors = {
    active: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    paused: "bg-gray-100 text-gray-800",
  };

  const priorityColors = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800",
  };

  const goalTypeIcons: Record<string, string> = {
    accuracy: "🎯",
    score: "⭐",
    games_played: "🎮",
    streak: "🔥",
    topic_mastery: "📚",
  };

  const goalTypeLabels: Record<string, string> = {
    accuracy: "Accuracy Goal",
    score: "Score Goal",
    games_played: "Games Played",
    streak: "Streak Goal",
    topic_mastery: "Topic Mastery",
  };

  return (
    <Card className={`overflow-hidden transition-all ${goal.status === "completed" ? "opacity-75" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{goalTypeIcons[goal.goalType] || "🎯"}</span>
              <div>
                <CardTitle className="text-lg">{goal.goalName}</CardTitle>
                <p className="text-xs text-gray-600">
                  {goalTypeLabels[goal.goalType] || goal.goalType}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={statusColors[goal.status]}>
              {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
            </Badge>
            <Badge className={priorityColors[goal.priority]}>
              {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-blue-600">
              {goal.progressPercentage}%
            </span>
          </div>
          <Progress value={goal.progressPercentage} className="h-3" />
        </div>

        {/* Current vs Target */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Current</p>
            <p className="text-2xl font-bold text-blue-600">{goal.currentValue}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Target</p>
            <p className="text-2xl font-bold text-gray-700">{goal.targetValue}</p>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700">
            Due: {new Date(goal.dueDate).toLocaleDateString()}
          </span>
          {isOverdue && (
            <Badge className="bg-red-100 text-red-800 ml-auto">
              <AlertCircle className="w-3 h-3 mr-1" />
              Overdue
            </Badge>
          )}
          {isDueSoon && !isOverdue && (
            <Badge className="bg-yellow-100 text-yellow-800 ml-auto">
              <Clock className="w-3 h-3 mr-1" />
              Due Soon
            </Badge>
          )}
        </div>

        {/* Feedback */}
        {goal.feedback && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <p className="text-xs font-medium text-indigo-900 mb-1">Teacher Feedback</p>
            <p className="text-sm text-indigo-800">{goal.feedback}</p>
          </div>
        )}

        {/* Status Message */}
        {goal.status === "completed" && goal.completedDate && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-900">Goal Completed!</p>
              <p className="text-xs text-green-700">
                Completed on {new Date(goal.completedDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}

        {goal.status === "active" && goal.progressPercentage === 100 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-sm font-medium text-purple-900">
              🎉 You've reached your target! Great work!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
