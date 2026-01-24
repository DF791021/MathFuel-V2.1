import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Loader,
} from "lucide-react";

interface AIGoalSuggestionsProps {
  playerId: number;
  playerName: string;
  classId: number;
  onGoalsCreated?: () => void;
}

export default function AIGoalSuggestions({
  playerId,
  playerName,
  classId,
  onGoalsCreated,
}: AIGoalSuggestionsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(
    new Set()
  );

  // Fetch AI suggestions
  const {
    data: suggestionsData,
    isLoading: isLoadingSuggestions,
    refetch: refetchSuggestions,
  } = trpc.goals.getAISuggestions.useQuery(
    { playerId },
    { enabled: false }
  );

  // Accept suggestions mutation
  const acceptSuggestionsMutation = trpc.goals.acceptAISuggestions.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setShowSuggestions(false);
        setSelectedSuggestions(new Set());
        onGoalsCreated?.();
      } else {
        toast.error(data.error || "Failed to create goals");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create goals");
    },
  });

  const handleGenerateSuggestions = async () => {
    setShowSuggestions(true);
    await refetchSuggestions();
  };

  const handleToggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleAcceptSuggestions = () => {
    if (selectedSuggestions.size === 0) {
      toast.error("Please select at least one goal");
      return;
    }

    if (!suggestionsData?.suggestions) {
      toast.error("No suggestions available");
      return;
    }

    const selectedGoals = suggestionsData.suggestions.filter((_, index) =>
      selectedSuggestions.has(index)
    );

    acceptSuggestionsMutation.mutate({
      playerId,
      playerName,
      classId,
      suggestions: selectedGoals,
    });
  };

  if (!showSuggestions) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Sparkles className="w-5 h-5" />
            AI-Powered Goal Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-800 mb-4">
            Get personalized goal recommendations based on {playerName}'s
            performance data. Our AI analyzes their strengths and areas for
            improvement to suggest achievable targets.
          </p>
          <Button
            onClick={handleGenerateSuggestions}
            disabled={isLoadingSuggestions}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoadingSuggestions ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Suggestions
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingSuggestions) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-blue-600 mr-3" />
            <p className="text-gray-600">
              Analyzing {playerName}'s performance...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!suggestionsData?.success || !suggestionsData?.suggestions) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900">
                Could not generate suggestions
              </p>
              <p className="text-sm text-red-700 mt-1">
                {suggestionsData?.error ||
                  "Please ensure the student has some game history"}
              </p>
              <Button
                onClick={() => setShowSuggestions(false)}
                variant="outline"
                className="mt-3"
              >
                Go Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const suggestions = suggestionsData.suggestions;
  const performanceData = suggestionsData.performanceData;

  return (
    <div className="space-y-4">
      {/* Performance Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-sm">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-600">Average Accuracy</p>
              <p className="text-2xl font-bold text-blue-600">
                {performanceData?.avgAccuracy || 0}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-green-600">
                {performanceData?.avgScore || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Games Played</p>
              <p className="text-2xl font-bold text-purple-600">
                {performanceData?.gamesPlayed || 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Topics to Improve</p>
              <p className="text-2xl font-bold text-orange-600">
                {performanceData?.weakTopics?.length || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recommended Goals
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Select the goals you'd like to create for {playerName}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedSuggestions.has(index)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleToggleSuggestion(index)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded border-2 mt-1 flex items-center justify-center flex-shrink-0 ${
                      selectedSuggestions.has(index)
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedSuggestions.has(index) && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {suggestion.goalName}
                      </h4>
                      <Badge
                        className={`text-xs ${
                          suggestion.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : suggestion.priority === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }`}
                      >
                        {suggestion.priority}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      {suggestion.rationale}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        <strong>Type:</strong> {suggestion.goalType}
                      </span>
                      <span>
                        <strong>Target:</strong> {suggestion.targetValue}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleAcceptSuggestions}
              disabled={
                selectedSuggestions.size === 0 ||
                acceptSuggestionsMutation.isPending
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {acceptSuggestionsMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Creating Goals...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create {selectedSuggestions.size} Goal
                  {selectedSuggestions.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
            <Button
              onClick={() => {
                setShowSuggestions(false);
                setSelectedSuggestions(new Set());
              }}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>💡 Tip:</strong> AI suggestions are based on {playerName}'s
            recent performance. Goals are typically achievable within 30 days
            with consistent effort. You can always adjust or add more goals
            manually.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
