import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target,
  TrendingUp,
  Award,
  Zap,
  Calendar,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Filter,
} from "lucide-react";
import StudentGoalCard from "@/components/StudentGoalCard";
import StudentProgressChart from "@/components/StudentProgressChart";
import MilestoneAchievements from "@/components/MilestoneAchievements";
import EncouragementMessages from "@/components/EncouragementMessages";

type GoalStatus = "active" | "completed" | "failed" | "paused";
type SortBy = "dueDate" | "progress" | "priority" | "created";

export default function StudentGoalPortal() {
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<GoalStatus | "all">("active");
  const [sortBy, setSortBy] = useState<SortBy>("dueDate");
  const [showCompleted, setShowCompleted] = useState(false);

  // Fetch student's goals
  const { data: goals, isLoading: goalsLoading } = trpc.goals.getStudentGoals.useQuery(
    { playerId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Fetch student achievements
  const { data: achievements } = trpc.goals.getStudentAchievements.useQuery(
    { playerId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Fetch goal statistics
  const { data: stats } = trpc.goals.getStatistics.useQuery();

  if (goalsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filter and sort goals
  let filteredGoals = goals || [];

  if (filterStatus !== "all") {
    filteredGoals = filteredGoals.filter((g: any) => g.status === filterStatus);
  }

  if (!showCompleted) {
    filteredGoals = filteredGoals.filter((g: any) => g.status !== "completed");
  }

  // Sort goals
  filteredGoals = [...filteredGoals].sort((a: any, b: any) => {
    switch (sortBy) {
      case "dueDate":
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case "progress":
        return b.progressPercentage - a.progressPercentage;
      case "priority":
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return (
          (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) -
          (priorityOrder[b.priority as keyof typeof priorityOrder] || 3)
        );
      case "created":
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      default:
        return 0;
    }
  });

  const activeGoals = goals?.filter((g: any) => g.status === "active") || [];
  const completedGoals = goals?.filter((g: any) => g.status === "completed") || [];
  const overallProgress =
    goals && goals.length > 0
      ? Math.round(
          goals.reduce((sum: number, g: any) => sum + (g.progressPercentage || 0), 0) /
            goals.length
        )
      : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">
              Your Learning Goals
            </h1>
            <p className="text-blue-700">
              Track your progress and celebrate your achievements!
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600">{overallProgress}%</div>
            <p className="text-sm text-blue-700">Overall Progress</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {activeGoals.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {completedGoals.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Achievements unlocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Badges Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {achievements?.length || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">Keep it up!</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats?.completionRate || 0}%
            </div>
            <p className="text-xs text-gray-600 mt-1">Goals completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="goals">
            <Target className="w-4 h-4 mr-2" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="progress">
            <TrendingUp className="w-4 h-4 mr-2" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="encouragement">
            <Sparkles className="w-4 h-4 mr-2" />
            Motivation
          </TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          {/* Filters and Sorting */}
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as GoalStatus | "all")}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Goals</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dueDate">Sort by Due Date</option>
              <option value="progress">Sort by Progress</option>
              <option value="priority">Sort by Priority</option>
              <option value="created">Sort by Created</option>
            </select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Show Completed</span>
            </label>
          </div>

          {/* Goals List */}
          {filteredGoals.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600 mb-2">No goals found</p>
                  <p className="text-sm text-gray-500">
                    {filterStatus === "all"
                      ? "Your teacher will set goals for you soon!"
                      : `No ${filterStatus} goals at the moment`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredGoals.map((goal: any) => (
                <StudentGoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <StudentProgressChart goals={goals || []} />
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <MilestoneAchievements achievements={(achievements || []) as any} />
        </TabsContent>

        {/* Encouragement Tab */}
        <TabsContent value="encouragement" className="space-y-4">
          <EncouragementMessages
            goals={goals || []}
            achievements={(achievements || []) as any}
            studentName={user?.name || "Student"}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
