import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  Award,
  Clock,
} from "lucide-react";

interface ImprovementInsightsProps {
  period?: "week" | "month" | "semester";
}

export default function ImprovementInsights({
  period = "month",
}: ImprovementInsightsProps) {
  // Fetch improvement dashboard data
  const { data: dashboard, isLoading } = trpc.analytics.getImprovementDashboard.useQuery({
    period,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-100 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-8 text-gray-500">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No insights available</p>
      </div>
    );
  }

  // Generate insights
  const insights = [];

  // Top performers insight
  if (dashboard.improving && dashboard.improving.length > 0) {
    const topStudent = dashboard.improving[0];
    insights.push({
      type: "success",
      icon: TrendingUp,
      title: "Top Performer",
      message: `${topStudent.playerName} is showing excellent improvement with ${topStudent.improvementPercentage}% progress!`,
      action: "Recognize and encourage this student",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700",
      badgeColor: "bg-green-600",
    });
  }

  // At-risk students insight
  if (dashboard.declining && dashboard.declining.length > 0) {
    const atRiskCount = dashboard.declining.length;
    insights.push({
      type: "warning",
      icon: AlertCircle,
      title: "Students Needing Support",
      message: `${atRiskCount} student${atRiskCount > 1 ? "s" : ""} ${atRiskCount > 1 ? "are" : "is"} showing declining performance. Consider providing additional support.`,
      action: "Review individual performance and provide interventions",
      color: "bg-red-50 border-red-200",
      textColor: "text-red-700",
      badgeColor: "bg-red-600",
    });
  }

  // Milestone insight
  if (dashboard.milestones && dashboard.milestones.length > 0) {
    const recentMilestone = dashboard.milestones[0];
    insights.push({
      type: "achievement",
      icon: Award,
      title: "Recent Achievement",
      message: `${recentMilestone.playerName} achieved "${recentMilestone.milestoneDescription}"!`,
      action: "Celebrate this milestone with the class",
      color: "bg-yellow-50 border-yellow-200",
      textColor: "text-yellow-700",
      badgeColor: "bg-yellow-600",
    });
  }

  // General recommendations
  const recommendations = [
    {
      icon: Target,
      title: "Set Learning Goals",
      description: "Help students set specific accuracy or score targets for the next period.",
    },
    {
      icon: Clock,
      title: "Track Progress Regularly",
      description: "Review analytics weekly to catch trends early and adjust instruction.",
    },
    {
      icon: Lightbulb,
      title: "Identify Knowledge Gaps",
      description: "Focus on question types where students struggle most.",
    },
    {
      icon: CheckCircle,
      title: "Celebrate Wins",
      description: "Recognize both small improvements and major milestones.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <Card key={index} className={`border-l-4 ${insight.color}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <Icon className={`w-6 h-6 ${insight.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${insight.textColor}`}>
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-700 mt-1">{insight.message}</p>
                        <div className="mt-3">
                          <Badge className={`${insight.badgeColor} text-white`}>
                            {insight.action}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
              <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No insights available yet. Keep tracking student progress!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recommendations for Improvement
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec, index) => {
            const Icon = rec.icon;
            return (
              <Card key={index} className="hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Statistics Summary */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Improving
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {dashboard.improving?.length ?? 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Stable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">
                {Math.max(0, (dashboard.improving?.length ?? 0) + (dashboard.declining?.length ?? 0))}
              </div>
              <p className="text-xs text-gray-600 mt-1">students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Declining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {dashboard.declining?.length ?? 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {dashboard.milestones?.length ?? 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">achieved</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Items */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Lightbulb className="w-5 h-5" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-blue-900">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Review the performance details for students in decline</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>Identify common question types where students struggle</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Plan targeted interventions for at-risk students</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Celebrate and share success stories with your class</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
