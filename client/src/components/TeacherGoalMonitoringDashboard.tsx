import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Users,
  Zap,
  Download,
} from "lucide-react";

interface TeacherGoalMonitoringDashboardProps {
  classId: number;
  className: string;
}

export default function TeacherGoalMonitoringDashboard({
  classId,
  className,
}: TeacherGoalMonitoringDashboardProps) {
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  // Fetch goal adoption metrics
  const { data: metricsData } = trpc.goalMonitoring.getClassMetrics.useQuery(
    { classId },
    { enabled: !!classId }
  );

  // Fetch student adoption status
  const { data: adoptionData } = trpc.goalMonitoring.getStudentAdoptionStatus.useQuery(
    { classId },
    { enabled: !!classId }
  );

  // Fetch at-risk goals
  const { data: atRiskData } = trpc.goalMonitoring.getAtRiskGoals.useQuery(
    { classId },
    { enabled: !!classId }
  );

  // Fetch goal type distribution
  const { data: distributionData } = trpc.goalMonitoring.getGoalTypeDistribution.useQuery(
    { classId },
    { enabled: !!classId }
  );

  const metrics = metricsData?.metrics;
  const students = adoptionData?.students || [];
  const atRiskGoals = atRiskData?.goals || [];
  const goalTypes = distributionData?.distribution || [];

  // Calculate adoption rate
  const adoptionRate = students.length > 0
    ? Math.round(
        (students.filter((s) => s.totalGoals > 0).length / students.length) * 100
      )
    : 0;

  // Prepare chart data
  const studentProgressData = useMemo(() => {
    return students.map((student) => ({
      name: student.playerName || "Unknown",
      active: Number(student.activeGoals) || 0,
      completed: Number(student.completedGoals) || 0,
      failed: Number(student.failedGoals) || 0,
      progress: Math.round(Number(student.avgProgress) || 0),
    }));
  }, [students]);

  const goalTypeData = useMemo(() => {
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
    return goalTypes.map((type, index) => ({
      name: type.goalType || "Unknown",
      value: type.count || 0,
      color: colors[index % colors.length],
    }));
  }, [goalTypes]);

  const handleExport = () => {
    const csvContent = [
      ["Student Name", "Total Goals", "Active", "Completed", "Failed", "Avg Progress"],
      ...students.map((s) => [
        s.playerName || "Unknown",
        s.totalGoals || 0,
        s.activeGoals || 0,
        s.completedGoals || 0,
        s.failedGoals || 0,
        Math.round(Number(s.avgProgress) || 0) + "%",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goal-adoption-${className}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Goal Adoption Monitor</h2>
          <p className="text-sm text-gray-600">{className}</p>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalGoals || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Goals set by students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Adoption Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adoptionRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {students.filter((s) => s.totalGoals > 0).length} of {students.length} students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.completedGoals || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Goals achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              At Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{atRiskGoals.length}</div>
            <p className="text-xs text-gray-500 mt-1">Goals behind schedule</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Student Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {studentProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={studentProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" fill="#3b82f6" name="Active" />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goal Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Goal Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goalTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={goalTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {goalTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* At-Risk Goals */}
      {atRiskGoals.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              Goals At Risk ({atRiskGoals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atRiskGoals.slice(0, 5).map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-center justify-between p-3 bg-white rounded border border-red-200"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{goal.goalName}</p>
                    <p className="text-xs text-gray-600">
                      {goal.playerName} • {goal.progressPercentage}% progress
                    </p>
                  </div>
                  <Badge variant="destructive">{goal.priority}</Badge>
                </div>
              ))}
              {atRiskGoals.length > 5 && (
                <p className="text-sm text-gray-600 text-center">
                  +{atRiskGoals.length - 5} more goals at risk
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Student Goal Adoption Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {students.length > 0 ? (
              students.map((student) => (
                <div
                  key={student.playerId}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
                  onClick={() =>
                    setSelectedStudent(
                      selectedStudent === student.playerId ? null : student.playerId
                    )
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{student.playerName || "Unknown"}</p>
                      <div className="flex gap-4 mt-1 text-sm text-gray-600">
                        <span>{student.totalGoals || 0} goals</span>
                        <span className="text-blue-600">
                          {student.activeGoals || 0} active
                        </span>
                        <span className="text-green-600">
                          {student.completedGoals || 0} completed
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {Math.round(Number(student.avgProgress) || 0)}%
                      </div>
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.round(Number(student.avgProgress) || 0)}%` }}
                      />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">
                No students have set goals yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
