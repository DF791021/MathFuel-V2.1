import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Target, CheckCircle, AlertCircle } from "lucide-react";

interface Goal {
  id: number;
  goalName: string;
  goalType: string;
  progressPercentage: number;
  status: "active" | "completed" | "failed" | "paused";
  targetValue: number;
  currentValue: number;
}

interface StudentProgressChartProps {
  goals: Goal[];
}

export default function StudentProgressChart({ goals }: StudentProgressChartProps) {
  // Prepare data for progress by goal type
  const goalTypeProgress = goals.reduce(
    (acc: Record<string, { name: string; progress: number; count: number }>, goal) => {
      if (!acc[goal.goalType]) {
        acc[goal.goalType] = {
          name: goal.goalType.replace("_", " ").toUpperCase(),
          progress: 0,
          count: 0,
        };
      }
      acc[goal.goalType].progress += goal.progressPercentage;
      acc[goal.goalType].count += 1;
      return acc;
    },
    {}
  );

  const typeProgressData = Object.values(goalTypeProgress).map((item) => ({
    name: item.name,
    progress: Math.round(item.progress / item.count),
  }));

  // Prepare data for goal status distribution
  const statusDistribution = goals.reduce(
    (acc: Record<string, number>, goal) => {
      acc[goal.status] = (acc[goal.status] || 0) + 1;
      return acc;
    },
    {}
  );

  const statusData = Object.entries(statusDistribution).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  // Prepare data for progress timeline (simulated)
  const progressTimeline = goals
    .sort((a, b) => a.id - b.id)
    .map((goal, index) => ({
      name: `Goal ${index + 1}`,
      progress: goal.progressPercentage,
      target: goal.targetValue,
      current: goal.currentValue,
    }));

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Average Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {goals.length > 0
                ? Math.round(
                    goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-gray-600 mt-1">Across all goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {goals.filter((g) => g.status === "completed").length}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {goals.length > 0
                ? Math.round(
                    (goals.filter((g) => g.status === "completed").length / goals.length) * 100
                  )
                : 0}
              % completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Active Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {goals.filter((g) => g.status === "active").length}
            </div>
            <p className="text-xs text-gray-600 mt-1">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress by Goal Type */}
      {typeProgressData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progress by Goal Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeProgressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Bar dataKey="progress" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Goal Status Distribution */}
      {statusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Goal Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Progress Timeline */}
      {progressTimeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Goal Progress Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                  name="Current Progress"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">No goals yet</p>
              <p className="text-sm text-gray-500">
                Your teacher will set goals for you soon!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
