import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Calendar, Target, AlertCircle, CheckCircle } from "lucide-react";

interface GoalCreationFormProps {
  playerId: number;
  playerName: string;
  classId: number;
  onSuccess?: () => void;
}

export default function GoalCreationForm({
  playerId,
  playerName,
  classId,
  onSuccess,
}: GoalCreationFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    goalType: "accuracy" as const,
    goalName: "",
    goalDescription: "",
    targetValue: "",
    priority: "medium" as const,
    daysUntilDue: 30,
    notes: "",
  });

  const createGoalMutation = trpc.goals.createGoal.useMutation({
    onSuccess: () => {
      toast.success(`Goal created for ${playerName}!`);
      setFormData({
        goalType: "accuracy",
        goalName: "",
        goalDescription: "",
        targetValue: "",
        priority: "medium",
        daysUntilDue: 30,
        notes: "",
      });
      setIsOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to create goal: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.goalName.trim()) {
      toast.error("Please enter a goal name");
      return;
    }

    if (!formData.targetValue || parseInt(formData.targetValue) <= 0) {
      toast.error("Please enter a valid target value");
      return;
    }

    const startDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + formData.daysUntilDue);

    createGoalMutation.mutate({
      playerId,
      playerName,
      classId,
      goalType: formData.goalType,
      goalName: formData.goalName,
      goalDescription: formData.goalDescription || undefined,
      targetValue: parseInt(formData.targetValue),
      startDate,
      dueDate,
      priority: formData.priority,
      notes: formData.notes || undefined,
    });
  };

  const goalTypeDescriptions: Record<string, string> = {
    accuracy: "Target accuracy percentage (0-100%)",
    score: "Target average score",
    games_played: "Number of games to play",
    streak: "Consecutive correct answers",
    topic_mastery: "Topic mastery level (0-100%)",
  };

  const goalTypeLabels: Record<string, string> = {
    accuracy: "Accuracy Target",
    score: "Score Target",
    games_played: "Games Played",
    streak: "Correct Answer Streak",
    topic_mastery: "Topic Mastery",
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        <Target className="w-4 h-4 mr-2" />
        Set New Goal
      </Button>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Target className="w-5 h-5" />
          Create Goal for {playerName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Goal Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Type
            </label>
            <select
              value={formData.goalType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  goalType: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="accuracy">Accuracy Target</option>
              <option value="score">Score Target</option>
              <option value="games_played">Games Played</option>
              <option value="streak">Correct Answer Streak</option>
              <option value="topic_mastery">Topic Mastery</option>
            </select>
            <p className="text-xs text-gray-600 mt-1">
              {goalTypeDescriptions[formData.goalType]}
            </p>
          </div>

          {/* Goal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Name *
            </label>
            <Input
              type="text"
              placeholder="e.g., Achieve 90% Accuracy"
              value={formData.goalName}
              onChange={(e) =>
                setFormData({ ...formData, goalName: e.target.value })
              }
              className="w-full"
            />
          </div>

          {/* Goal Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              placeholder="Optional: Describe what this goal means and why it's important"
              value={formData.goalDescription}
              onChange={(e) =>
                setFormData({ ...formData, goalDescription: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>

          {/* Target Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Value *
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter target value"
                value={formData.targetValue}
                onChange={(e) =>
                  setFormData({ ...formData, targetValue: e.target.value })
                }
                className="flex-1"
                min="1"
              />
              <span className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                {formData.goalType === "accuracy" || formData.goalType === "topic_mastery"
                  ? "%"
                  : ""}
              </span>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Days Until Due */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Days Until Due
            </label>
            <Input
              type="number"
              value={formData.daysUntilDue}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  daysUntilDue: parseInt(e.target.value) || 30,
                })
              }
              className="w-full"
              min="1"
              max="365"
            />
            <p className="text-xs text-gray-600 mt-1">
              Due: {new Date(Date.now() + formData.daysUntilDue * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teacher Notes
            </label>
            <textarea
              placeholder="Optional: Add any additional notes or context"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              This goal will be visible to {playerName} and help track their progress toward this target.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={createGoalMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {createGoalMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Goal
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
