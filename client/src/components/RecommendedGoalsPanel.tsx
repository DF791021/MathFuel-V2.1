import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lightbulb,
  Target,
  TrendingUp,
  Zap,
  CheckCircle,
  Loader,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface GoalRecommendation {
  title: string;
  description: string;
  type: "accuracy" | "score" | "games_played" | "streak" | "topic_mastery";
  targetValue: number;
  priority: "high" | "medium" | "low";
  rationale: string;
  estimatedDaysToComplete: number;
  relatedInsight: string;
}

interface RecommendedGoalsPanelProps {
  playerId: number;
  playerName: string;
  classId?: number;
}

const goalTypeIcons = {
  accuracy: Target,
  score: TrendingUp,
  games_played: Zap,
  streak: CheckCircle,
  topic_mastery: Lightbulb,
};

const priorityColors = {
  high: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-green-100 text-green-800",
};

export default function RecommendedGoalsPanel({
  playerId,
  playerName,
  classId = 0,
}: RecommendedGoalsPanelProps) {
  const [creatingGoal, setCreatingGoal] = useState<string | null>(null);

  // Fetch recommendations
  const { data: recommendationsData, isLoading, refetch } = trpc.goals.getRecommendations.useQuery(
    { playerId },
    { enabled: !!playerId }
  );

  // Create goal from recommendation
  const createGoalMutation = trpc.goals.createGoal.useMutation({
    onSuccess: () => {
      toast.success("Goal created successfully!");
      setCreatingGoal(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create goal");
      setCreatingGoal(null);
    },
  });

  const handleCreateGoal = (recommendation: GoalRecommendation) => {
    setCreatingGoal(recommendation.title);

    createGoalMutation.mutate({
      playerId,
      playerName,
      classId,
      goalType: recommendation.type,
      goalName: recommendation.title,
      goalDescription: recommendation.description,
      targetValue: recommendation.targetValue,
      startDate: new Date(),
      dueDate: new Date(Date.now() + recommendation.estimatedDaysToComplete * 24 * 60 * 60 * 1000),
      priority: recommendation.priority,
      notes: `Based on insight: ${recommendation.relatedInsight}`,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading recommendations...</span>
        </CardContent>
      </Card>
    );
  }

  const recommendations = recommendationsData?.recommendations || [];

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Recommended Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-4">
            No recommendations available yet. Write journal entries to get personalized goal suggestions!
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Recommended Goals
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Based on your journal insights, here are personalized goals to help you improve
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((recommendation, index) => {
          const IconComponent = goalTypeIcons[recommendation.type];

          return (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg mt-1">
                    <IconComponent className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{recommendation.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                  </div>
                </div>
                <Badge className={priorityColors[recommendation.priority]}>
                  {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)}
                </Badge>
              </div>

              {/* Goal Details */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Target Value</p>
                  <p className="font-semibold text-gray-800">{recommendation.targetValue}</p>
                </div>
                <div>
                  <p className="text-gray-600">Est. Days to Complete</p>
                  <p className="font-semibold text-gray-800">{recommendation.estimatedDaysToComplete}</p>
                </div>
              </div>

              {/* Rationale */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-1">Why This Goal?</p>
                <p className="text-sm text-gray-700">{recommendation.rationale}</p>
              </div>

              {/* Related Insight */}
              <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                <p className="text-xs font-semibold text-blue-700 mb-1">Related Insight</p>
                <p className="text-sm text-blue-800">{recommendation.relatedInsight}</p>
              </div>

              {/* Create Button */}
              <Button
                onClick={() => handleCreateGoal(recommendation)}
                disabled={creatingGoal === recommendation.title}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {creatingGoal === recommendation.title ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Create This Goal
                  </>
                )}
              </Button>
            </div>
          );
        })}

        {/* Refresh Button */}
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="w-full"
        >
          Refresh Recommendations
        </Button>
      </CardContent>
    </Card>
  );
}
