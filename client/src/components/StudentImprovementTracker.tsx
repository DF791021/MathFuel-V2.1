import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Zap,
  AlertCircle,
} from "lucide-react";

interface StudentImprovementTrackerProps {
  playerId: number;
  playerName: string;
}

export default function StudentImprovementTracker({
  playerId,
  playerName,
}: StudentImprovementTrackerProps) {
  const [period, setPeriod] = useState<"week" | "month" | "semester">("month");

  // Fetch improvement metrics
  const { data: improvement } = trpc.analytics.getStudentImprovement.useQuery({
    playerId,
    period,
  });

  // Fetch historical snapshots
  const { data: snapshots } = trpc.analytics.getHistoricalSnapshots.useQuery({
    playerId,
    limit: 30,
  });

  // Fetch ranking history
  const { data: rankingHistory } = trpc.analytics.getStudentRankingHistory.useQuery({
    playerId,
    limit: 30,
  });

  // Fetch milestones
  const { data: milestones } = trpc.analytics.getStudentMilestones.useQuery({
    playerId,
    limit: 20,
  });

  // Prepare data for charts
  const historyData = snapshots
    ?.slice()
    .reverse()
    .map((snap) => ({
      date: new Date(snap.snapshotDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      accuracy: snap.accuracyRate,
      score: snap.averageScore,
      games: snap.totalGamesPlayed,
    })) || [];

  const rankingData = rankingHistory
    ?.slice()
    .reverse()
    .map((rank) => ({
      date: new Date(rank.recordDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      rank: rank.currentRank,
      score: rank.totalScore,
    })) || [];

  const improvementMetric = improvement?.[0];

  const getTrendColor = (trend?: string) => {
    if (trend === "improving") return "text-green-600";
    if (trend === "declining") return "text-red-600";
    return "text-gray-600";
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === "improving")
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    if (trend === "declining")
      return <TrendingDown className="w-5 h-5 text-red-600" />;
    return <Target className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriod("week")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === "week"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Last Week
        </button>
        <button
          onClick={() => setPeriod("month")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === "month"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Last Month
        </button>
        <button
          onClick={() => setPeriod("semester")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === "semester"
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          This Semester
        </button>
      </div>

      {/* Improvement Summary Cards */}
      {improvementMetric && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="capitalize font-bold text-gray-900">
                  {improvementMetric.improvementTrend}
                </div>
                {getTrendIcon(improvementMetric.improvementTrend)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Accuracy Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
              <div
                className={`text-2xl font-bold ${
                  (improvementMetric.accuracyChange ?? 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {(improvementMetric.accuracyChange ?? 0) > 0 ? "+" : ""}
                {improvementMetric.accuracyChange ?? 0}%
                </div>
                <div className="text-sm text-gray-600">
                  {improvementMetric.previousAccuracy}% → {improvementMetric.currentAccuracy}%
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Score Change
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
              <div
                className={`text-2xl font-bold ${
                  (improvementMetric.scoreChange ?? 0) >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {(improvementMetric.scoreChange ?? 0) > 0 ? "+" : ""}
                {improvementMetric.scoreChange ?? 0}
                </div>
                <div className="text-sm text-gray-600">
                  {improvementMetric.previousScore} → {improvementMetric.currentScore}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Improvement %
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-blue-600">
                  {improvementMetric.improvementPercentage}%
                </div>
                <Zap className="w-5 h-5 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Details */}
      <Tabs defaultValue="accuracy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accuracy">Accuracy Trend</TabsTrigger>
          <TabsTrigger value="score">Score Trend</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
        </TabsList>

        {/* Accuracy Trend */}
        <TabsContent value="accuracy">
          <Card>
            <CardHeader>
              <CardTitle>Accuracy Progress Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Area
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorAccuracy)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Score Trend */}
        <TabsContent value="score">
          <Card>
            <CardHeader>
              <CardTitle>Score Progress Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      name="Average Score"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="games"
                      stroke="#f59e0b"
                      name="Games Played"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ranking */}
        <TabsContent value="ranking">
          <Card>
            <CardHeader>
              <CardTitle>Class Ranking Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {rankingData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rankingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rank" fill="#8b5cf6" name="Rank" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No ranking data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Milestones */}
        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" />
                Achievements & Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {milestones && milestones.length > 0 ? (
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {milestone.milestoneDescription}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(milestone.achievedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {milestone.rewardPoints > 0 && (
                            <Badge className="bg-yellow-500">
                              +{milestone.rewardPoints} pts
                            </Badge>
                          )}
                          <Award className="w-5 h-5 text-yellow-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No milestones achieved yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
