import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
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
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface ClassImprovementComparisonProps {
  classId: number;
  className: string;
}

const COLORS = {
  improving: "#10b981",
  stable: "#6b7280",
  declining: "#ef4444",
};

export default function ClassImprovementComparison({
  classId,
  className,
}: ClassImprovementComparisonProps) {
  const [period, setPeriod] = useState<"week" | "month" | "semester">("month");

  // Fetch class improvement metrics
  const { data: classImprovement } = trpc.analytics.getClassImprovement.useQuery({
    classId,
    period,
  });

  // Fetch top improving students
  const { data: topImproving } = trpc.analytics.getTopImprovingStudents.useQuery({
    period,
    limit: 10,
  });

  // Fetch students needing attention
  const { data: needingAttention } = trpc.analytics.getStudentsNeedingAttention.useQuery({
    period,
    limit: 10,
  });

  const improvement = classImprovement?.[0];

  // Prepare data for pie chart
  const studentTrendData = improvement
    ? [
        {
          name: "Improving",
          value: improvement.improvingStudentCount,
          color: COLORS.improving,
        },
        {
          name: "Stable",
          value: improvement.stableStudentCount,
          color: COLORS.stable,
        },
        {
          name: "Declining",
          value: improvement.decliningStudentCount,
          color: COLORS.declining,
        },
      ].filter((item) => item.value > 0)
    : [];

  // Prepare comparison data
  const comparisonData = improvement
    ? [
        {
          metric: "Accuracy",
          previous: improvement.previousClassAccuracy,
          current: improvement.currentClassAccuracy,
        },
        {
          metric: "Avg Score",
          previous: improvement.previousAverageScore,
          current: improvement.currentAverageScore,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriod("week")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === "week"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Last Week
        </button>
        <button
          onClick={() => setPeriod("month")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === "month"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Last Month
        </button>
        <button
          onClick={() => setPeriod("semester")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            period === "semester"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          This Semester
        </button>
      </div>

      {/* Summary Cards */}
      {improvement && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Improving
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {improvement.improvingStudentCount}
              </div>
              <p className="text-xs text-gray-600 mt-1">students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-600" />
                Stable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">
                {improvement.stableStudentCount}
              </div>
              <p className="text-xs text-gray-600 mt-1">students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-600" />
                Declining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {improvement.decliningStudentCount}
              </div>
              <p className="text-xs text-gray-600 mt-1">students</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Student Trends</TabsTrigger>
          <TabsTrigger value="comparison">Performance Comparison</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Student Trends */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {studentTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={studentTrendData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {studentTrendData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Comparison */}
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              {comparisonData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="previous" fill="#9ca3af" name="Previous Period" />
                    <Bar dataKey="current" fill="#3b82f6" name="Current Period" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details */}
        <TabsContent value="details" className="space-y-6">
          {/* Top Improving Students */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Top Improving Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topImproving && topImproving.length > 0 ? (
                <div className="space-y-3">
                  {topImproving.map((student, index) => (
                    <div
                      key={student.id}
                      className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-600">#{index + 1}</Badge>
                            <h4 className="font-semibold text-gray-900">
                              {student.playerName}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Accuracy: {student.previousAccuracy}% → {student.currentAccuracy}%
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            +{student.improvementPercentage}%
                          </div>
                          <TrendingUp className="w-5 h-5 text-green-600 mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No improving students in this period</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students Needing Attention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                Students Needing Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {needingAttention && needingAttention.length > 0 ? (
                <div className="space-y-3">
                  {needingAttention.map((student, index) => (
                    <div
                      key={student.id}
                      className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-600">#{index + 1}</Badge>
                            <h4 className="font-semibold text-gray-900">
                              {student.playerName}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Accuracy: {student.previousAccuracy}% → {student.currentAccuracy}%
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">
                            {student.improvementPercentage}%
                          </div>
                          <TrendingDown className="w-5 h-5 text-red-600 mt-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No students in decline - great work!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
