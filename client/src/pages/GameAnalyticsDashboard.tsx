import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Trophy,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Download,
  FileText,
} from "lucide-react";
import {
  exportStudentPerformanceCSV,
  exportQuestionPerformanceCSV,
  exportClassPerformanceCSV,
  generateAnalyticsReport,
  downloadCSV,
  downloadReport,
} from "@/lib/analyticsExport";
import { toast } from "sonner";

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

export default function GameAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<"week" | "month" | "all">("month");
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);

  const handleExportStudents = () => {
    if (!dashboardData?.students) return;
    try {
      const csv = exportStudentPerformanceCSV(dashboardData.students);
      downloadCSV(csv, `student-performance-${new Date().toISOString().split("T")[0]}.csv`);
      toast.success("Student performance data exported!");
    } catch (error) {
      toast.error("Failed to export student data");
    }
  };

  const handleExportQuestions = () => {
    if (!dashboardData?.questions) return;
    try {
      const csv = exportQuestionPerformanceCSV(dashboardData.questions);
      downloadCSV(csv, `question-performance-${new Date().toISOString().split("T")[0]}.csv`);
      toast.success("Question performance data exported!");
    } catch (error) {
      toast.error("Failed to export question data");
    }
  };

  const handleExportClasses = () => {
    if (!dashboardData?.classes) return;
    try {
      const csv = exportClassPerformanceCSV(dashboardData.classes);
      downloadCSV(csv, `class-performance-${new Date().toISOString().split("T")[0]}.csv`);
      toast.success("Class performance data exported!");
    } catch (error) {
      toast.error("Failed to export class data");
    }
  };

  const handleExportFullReport = () => {
    if (!dashboardData) return;
    try {
      const report = generateAnalyticsReport(
        dashboardData.students,
        dashboardData.questions,
        dashboardData.classes,
        dashboardData.summary
      );
      downloadReport(report, `analytics-report-${new Date().toISOString().split("T")[0]}.txt`);
      toast.success("Full analytics report exported!");
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  // Fetch comprehensive dashboard data
  const { data: dashboardData, isLoading } = trpc.analytics.getDashboardData.useQuery({
    days: dateRange === "week" ? 7 : dateRange === "month" ? 30 : 365,
  });

  // Fetch student report if selected
  const { data: studentReport } = trpc.analytics.getStudentReport.useQuery(
    { playerId: selectedStudent! },
    { enabled: selectedStudent !== null }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const { summary, students, questions, difficult, classes, engagement } = dashboardData;

  // Prepare data for charts
  const engagementData = engagement.map((day) => ({
    date: day.date,
    games: day.gamesPlayedCount,
    players: day.uniquePlayersCount,
    accuracy: day.averageAccuracy,
  }));

  const studentPerformanceData = students.slice(0, 10).map((student) => ({
    name: student.playerName,
    accuracy: student.accuracyRate,
    score: student.averageScore,
    games: student.totalGamesPlayed,
  }));

  const questionDifficultyData = questions.slice(0, 8).map((q) => ({
    title: q.title.substring(0, 20),
    accuracy: q.accuracyRate,
    attempts: q.totalAttempts,
  }));

  const difficultyDistribution = [
    {
      name: "Easy",
      value: questions.filter((q) => q.difficulty === "easy").length,
    },
    {
      name: "Medium",
      value: questions.filter((q) => q.difficulty === "medium").length,
    },
    {
      name: "Hard",
      value: questions.filter((q) => q.difficulty === "hard").length,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Game Analytics Dashboard
          </h1>
          <p className="text-gray-600">
            Comprehensive insights into student performance and engagement
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={dateRange === "week" ? "default" : "outline"}
            onClick={() => setDateRange("week")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last 7 Days
          </Button>
          <Button
            variant={dateRange === "month" ? "default" : "outline"}
            onClick={() => setDateRange("month")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Last 30 Days
          </Button>
          <Button
            variant={dateRange === "all" ? "default" : "outline"}
            onClick={() => setDateRange("all")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            All Time
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleExportStudents}>
              <Download className="w-4 h-4 mr-2" />
              Export Students
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportQuestions}>
              <Download className="w-4 h-4 mr-2" />
              Export Questions
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportFullReport}>
              <FileText className="w-4 h-4 mr-2" />
              Full Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Games Played
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {summary.totalGamesPlayed}
                </div>
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {summary.totalStudents}
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round(summary.averageAccuracy)}%
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold text-gray-900">
                  {Math.round(summary.averageScore)}
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Engagement Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Engagement Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        interval={Math.floor(engagementData.length / 5)}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="games"
                        stroke="#10b981"
                        name="Games Played"
                      />
                      <Line
                        type="monotone"
                        dataKey="players"
                        stroke="#3b82f6"
                        name="Active Players"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Question Difficulty Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Question Difficulty Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={difficultyDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {difficultyDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Class Performance */}
            {classes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Class Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {classes.map((cls) => (
                      <div
                        key={cls.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {cls.className}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {cls.totalStudents} students • {cls.totalGamesPlayed} games
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {cls.classAccuracyRate}%
                          </p>
                          <p className="text-sm text-gray-600">Accuracy</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Student Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={studentPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accuracy" fill="#10b981" name="Accuracy %" />
                    <Bar dataKey="score" fill="#3b82f6" name="Avg Score" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Student List */}
            <Card>
              <CardHeader>
                <CardTitle>Student Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students.slice(0, 10).map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition"
                      onClick={() => setSelectedStudent(student.playerId)}
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {student.playerName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {student.totalGamesPlayed} games • {student.totalCorrectAnswers} correct
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {student.accuracyRate}%
                        </p>
                        <p className="text-sm text-gray-600">
                          Score: {student.totalScore}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Question Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={questionDifficultyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="title"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accuracy" fill="#10b981" name="Accuracy %" />
                    <Bar dataKey="attempts" fill="#f59e0b" name="Attempts" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Difficult Questions */}
            {difficult.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">
                    Questions Needing Attention
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {difficult.map((q) => (
                      <div
                        key={q.id}
                        className="p-4 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {q.title}
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Accuracy</p>
                            <p className="text-lg font-bold text-red-600">
                              {q.accuracyRate}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Attempts</p>
                            <p className="text-lg font-bold text-gray-900">
                              {q.totalAttempts}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Difficulty</p>
                            <p className="text-lg font-bold text-gray-900 capitalize">
                              {q.difficulty}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Accuracy Trend Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      interval={Math.floor(engagementData.length / 5)}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#10b981"
                      name="Average Accuracy"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Student Report */}
            {selectedStudent && studentReport && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Topic Mastery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studentReport.topicMastery.map((topic) => (
                        <div key={topic.id}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">
                              {topic.topic}
                            </span>
                            <span className="text-sm font-bold text-green-600">
                              {topic.masteryPercentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${topic.masteryPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Difficulty Progression</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {studentReport.difficultyProgression.map((prog) => (
                        <div
                          key={prog.id}
                          className="p-3 bg-gray-50 rounded-lg capitalize"
                        >
                          <div className="flex justify-between mb-1">
                            <span className="font-medium text-gray-900">
                              {prog.difficulty}
                            </span>
                            <span className="text-sm text-gray-600">
                              {prog.totalAttempts} attempts
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Accuracy: {prog.accuracyRate}% • Avg Score: {prog.averageScore}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
