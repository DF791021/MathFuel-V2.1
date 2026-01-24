import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InsightCard from "./InsightCard";
import { Loader, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface JournalInsightsPanelProps {
  playerId: number;
  playerName: string;
}

export default function JournalInsightsPanel({
  playerId,
  playerName,
}: JournalInsightsPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch latest insights
  const { data: insightsData, isLoading, refetch } = trpc.journal.getLatestInsights.useQuery(
    { playerId },
    { enabled: !!playerId }
  );

  // Generate insights mutation
  const generateMutation = trpc.journal.generateInsights.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Insights generated successfully!");
        refetch();
      } else {
        toast.error(data.error || "Failed to generate insights");
      }
      setIsGenerating(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to generate insights");
      setIsGenerating(false);
    },
  });

  const handleGenerateInsights = () => {
    setIsGenerating(true);
    generateMutation.mutate({
      playerId,
      playerName,
    });
  };

  const insights = insightsData?.insights;
  const hasInsights = insights && Object.keys(insights).length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading your insights...</span>
        </CardContent>
      </Card>
    );
  }

  if (!hasInsights) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Your AI-Generated Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              No insights generated yet. Write some journal entries and let AI analyze your learning patterns!
            </p>
            <Button
              onClick={handleGenerateInsights}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Generating Insights...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Insights from My Journals
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Your AI-Generated Insights
        </CardTitle>
        <Button
          onClick={handleGenerateInsights}
          disabled={isGenerating}
          variant="outline"
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Insights
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="progress_trend" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="progress_trend" className="text-xs">
              Progress
            </TabsTrigger>
            <TabsTrigger value="challenge_pattern" className="text-xs">
              Challenges
            </TabsTrigger>
            <TabsTrigger value="strategy_effectiveness" className="text-xs">
              Strategies
            </TabsTrigger>
            <TabsTrigger value="motivation_level" className="text-xs">
              Motivation
            </TabsTrigger>
            <TabsTrigger value="learning_style" className="text-xs">
              Learning
            </TabsTrigger>
          </TabsList>

          {insights.progress_trend && (
            <TabsContent value="progress_trend">
              <InsightCard
                type="progress_trend"
                insight={insights.progress_trend.insight}
                supportingData={insights.progress_trend.supportingData}
              />
            </TabsContent>
          )}

          {insights.challenge_pattern && (
            <TabsContent value="challenge_pattern">
              <InsightCard
                type="challenge_pattern"
                insight={insights.challenge_pattern.insight}
                supportingData={insights.challenge_pattern.supportingData}
              />
            </TabsContent>
          )}

          {insights.strategy_effectiveness && (
            <TabsContent value="strategy_effectiveness">
              <InsightCard
                type="strategy_effectiveness"
                insight={insights.strategy_effectiveness.insight}
                supportingData={insights.strategy_effectiveness.supportingData}
              />
            </TabsContent>
          )}

          {insights.motivation_level && (
            <TabsContent value="motivation_level">
              <InsightCard
                type="motivation_level"
                insight={insights.motivation_level.insight}
                supportingData={insights.motivation_level.supportingData}
              />
            </TabsContent>
          )}

          {insights.learning_style && (
            <TabsContent value="learning_style">
              <InsightCard
                type="learning_style"
                insight={insights.learning_style.insight}
                supportingData={insights.learning_style.supportingData}
              />
            </TabsContent>
          )}
        </Tabs>

        {/* Summary */}
        {insights.summary && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-800 mb-2">📊 Summary</h3>
            <p className="text-gray-700 leading-relaxed">{insights.summary}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
