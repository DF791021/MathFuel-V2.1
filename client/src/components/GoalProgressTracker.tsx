import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Target,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Edit2,
  Trash2,
  MessageSquare,
} from "lucide-react";

interface GoalProgressTrackerProps {
  playerId: number;
  playerName: string;
}

export default function GoalProgressTracker({
  playerId,
  playerName,
}: GoalProgressTrackerProps) {
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackType, setFeedbackType] = useState<"encouragement" | "suggestion" | "warning" | "celebration">("encouragement");

  // Fetch student goals
  const { data: goals, isLoading, refetch } = trpc.goals.getStudentGoals.useQuery({
    playerId,
  });

  // Fetch goal progress history
  const { data: progressHistory } = trpc.goals.getProgressHistory.useQuery(
    { goalId: selectedGoalId! },
    { enabled: selectedGoalId !== null }
  );

  // Fetch goal feedback
  const { data: feedback } = trpc.goals.getGoalFeedback.useQuery(
    { goalId: selectedGoalId! },
    { enabled: selectedGoalId !== null }
  );

  // Mutations
  const updateProgressMutation = trpc.goals.updateProgress.useMutation({
    onSuccess: () => {
      toast.success("Goal progress updated!");
      refetch();
    },
  });

  const addFeedbackMutation = trpc.goals.addFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback added!");
      setFeedbackText("");
      setFeedbackType("encouragement");
    },
  });

  const deleteGoalMutation = trpc.goals.deleteGoal.useMutation({
    onSuccess: () => {
      toast.success("Goal deleted!");
      setSelectedGoalId(null);
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!goals || goals.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-4">No goals set yet for {playerName}</p>
            <p className="text-sm text-gray-500">
              Create a goal to help {playerName} track their progress
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const failedGoals = goals.filter((g) => g.status === "failed");

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      case "paused":
        return <Clock className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      default:
        return "text-green-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Goal Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{goals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{activeGoals.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {completedGoals.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {goals.length > 0
                ? Math.round((completedGoals.length / goals.length) * 100)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-semibold text-gray-900">All Goals</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {goals.map((goal) => (
              <div
                key={goal.id}
                onClick={() => setSelectedGoalId(goal.id)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition ${
                  selectedGoalId === goal.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {goal.goalName}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {goal.currentValue} / {goal.targetValue}
                    </p>
                  </div>
                  <Badge className={getStatusColor(goal.status)}>
                    {getStatusIcon(goal.status)}
                  </Badge>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${goal.progressPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {goal.progressPercentage}% complete
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Details */}
        {selectedGoal && (
          <div className="lg:col-span-2 space-y-4">
            {/* Goal Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {selectedGoal.goalName}
                    </CardTitle>
                    {selectedGoal.goalDescription && (
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedGoal.goalDescription}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        deleteGoalMutation.mutate({ goalId: selectedGoal.id })
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Progress
                    </span>
                    <span className="text-sm font-bold text-blue-600">
                      {selectedGoal.progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${selectedGoal.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Goal Info Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-600">Target Value</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedGoal.targetValue}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Current Value</p>
                    <p className="text-lg font-bold text-blue-600">
                      {selectedGoal.currentValue}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Priority</p>
                    <p className={`text-lg font-bold ${getPriorityColor(selectedGoal.priority)}`}>
                      {selectedGoal.priority.charAt(0).toUpperCase() +
                        selectedGoal.priority.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Due Date</p>
                    <p className="text-lg font-bold text-gray-900">
                      {new Date(selectedGoal.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress History Chart */}
            {progressHistory && progressHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Progress History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={progressHistory.reverse()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="recordedDate"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(date) =>
                          new Date(date).toLocaleDateString()
                        }
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value) => `${value}%`}
                        labelFormatter={(date) =>
                          new Date(date).toLocaleDateString()
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="progressPercentage"
                        stroke="#3b82f6"
                        name="Progress %"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Feedback Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Teacher Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Feedback */}
                <div className="space-y-3 pb-4 border-b">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Feedback Type
                    </label>
                    <select
                      value={feedbackType}
                      onChange={(e) =>
                        setFeedbackType(e.target.value as any)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="encouragement">Encouragement</option>
                      <option value="suggestion">Suggestion</option>
                      <option value="warning">Warning</option>
                      <option value="celebration">Celebration</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Add feedback for the student..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                    rows={2}
                  />
                  <Button
                    onClick={() => {
                      if (!feedbackText.trim()) {
                        toast.error("Please enter feedback");
                        return;
                      }
                      addFeedbackMutation.mutate({
                        goalId: selectedGoal.id,
                        playerId,
                        feedbackText,
                        feedbackType,
                      });
                    }}
                    disabled={addFeedbackMutation.isPending}
                    className="w-full"
                  >
                    Add Feedback
                  </Button>
                </div>

                {/* Feedback List */}
                {feedback && feedback.length > 0 ? (
                  <div className="space-y-3">
                    {feedback.map((fb) => (
                      <div
                        key={fb.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start justify-between">
                          <Badge
                            className={
                              fb.feedbackType === "celebration"
                                ? "bg-green-600"
                                : fb.feedbackType === "warning"
                                ? "bg-red-600"
                                : fb.feedbackType === "suggestion"
                                ? "bg-yellow-600"
                                : "bg-blue-600"
                            }
                          >
                            {fb.feedbackType.charAt(0).toUpperCase() +
                              fb.feedbackType.slice(1)}
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {new Date(fb.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">
                          {fb.feedbackText}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-4">
                    No feedback yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
