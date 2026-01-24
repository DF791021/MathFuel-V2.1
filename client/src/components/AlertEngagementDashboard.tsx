import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, AlertCircle, CheckCircle2, Users, Bell, Download } from "lucide-react";
import { toast } from "sonner";

interface AlertEngagementDashboardProps {
  classId: number;
}

export function AlertEngagementDashboard({ classId }: AlertEngagementDashboardProps) {
  const [dateRange, setDateRange] = useState("30");

  // Fetch analytics data
  const { data: metrics, isLoading: metricsLoading } = trpc.alertAnalytics.getEngagementMetrics.useQuery({ classId });
  const { data: studentEngagement } = trpc.alertAnalytics.getStudentEngagement.useQuery({ classId });
  const { data: completion } = trpc.alertAnalytics.getCompletionByAlertStatus.useQuery({ classId });
  const { data: trends } = trpc.alertAnalytics.getEngagementTrends.useQuery({ classId, days: parseInt(dateRange) });
  const { data: preferences } = trpc.alertAnalytics.getPreferenceDistribution.useQuery({ classId });
  const { data: correlation } = trpc.alertAnalytics.getCorrelationAnalysis.useQuery({ classId });

  const handleExport = () => {
    const data = {
      metrics,
      studentEngagement,
      completion,
      correlation,
      exportDate: new Date().toISOString(),
    };
    const csv = JSON.stringify(data, null, 2);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alert-analytics-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    toast.success("Analytics exported successfully");
  };

  if (metricsLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  const completionData = [
    { name: "With Alerts", value: completion?.withAlerts?.completedGoals || 0, total: completion?.withAlerts?.totalGoals || 0 },
    { name: "Without Alerts", value: completion?.withoutAlerts?.completedGoals || 0, total: completion?.withoutAlerts?.totalGoals || 0 },
  ];

  const COLORS = ["#10b981", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alert Engagement Analytics</h2>
          <p className="text-gray-600 mt-1">Track how alerts impact student goal completion rates</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Alerts Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics?.totalAlertsSent || 0}</div>
            <p className="text-xs text-gray-500 mt-1">To {metrics?.studentsWithAlerts || 0} students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Alerts Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{correlation?.alertsEnabledCount || 0}</div>
            <p className="text-xs text-gray-500 mt-1">of {correlation?.studentEngagementCount || 0} students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completion with Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{correlation?.completionRates?.withAlerts || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">Goal completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Improvement Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{correlation?.completionRates?.improvementFactor}%</div>
            <p className="text-xs text-gray-500 mt-1">vs. without alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trends">Engagement Trends</TabsTrigger>
          <TabsTrigger value="completion">Goal Completion</TabsTrigger>
          <TabsTrigger value="students">Student Details</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Alert Engagement Over Time</CardTitle>
                  <CardDescription>Number of alerts sent and unique students engaged</CardDescription>
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {trends && trends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="alertsCount" stroke="#3b82f6" name="Alerts Sent" />
                    <Line type="monotone" dataKey="uniqueStudents" stroke="#10b981" name="Unique Students" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-gray-500">No trend data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Goal Completion Rate Comparison</CardTitle>
              <CardDescription>Students with alerts vs. without alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: "With Alerts", value: correlation?.completionRates?.withAlerts || 0 },
                          { name: "Without Alerts", value: correlation?.completionRates?.withoutAlerts || 0 },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold">With Alerts</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600">{correlation?.completionRates?.withAlerts || 0}%</div>
                    <p className="text-sm text-gray-600 mt-2">
                      {completion?.withAlerts?.completedGoals || 0} of {completion?.withAlerts?.totalGoals || 0} goals completed
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold">Without Alerts</span>
                    </div>
                    <div className="text-3xl font-bold text-red-600">{correlation?.completionRates?.withoutAlerts || 0}%</div>
                    <p className="text-sm text-gray-600 mt-2">
                      {completion?.withoutAlerts?.completedGoals || 0} of {completion?.withoutAlerts?.totalGoals || 0} goals completed
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold">Improvement</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{correlation?.completionRates?.improvementFactor}%</div>
                    <p className="text-sm text-gray-600 mt-2">Higher completion with alerts</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Alert Engagement</CardTitle>
              <CardDescription>Individual student alert adoption and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Student</th>
                      <th className="px-4 py-2 text-center font-semibold">Alerts Received</th>
                      <th className="px-4 py-2 text-center font-semibold">Frequency</th>
                      <th className="px-4 py-2 text-center font-semibold">Status</th>
                      <th className="px-4 py-2 text-left font-semibold">Last Alert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {studentEngagement && studentEngagement.length > 0 ? (
                      studentEngagement.map((student: any) => (
                        <tr key={student.studentId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{student.studentName}</td>
                          <td className="px-4 py-3 text-center">{student.alertsReceived || 0}</td>
                          <td className="px-4 py-3 text-center capitalize text-sm">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {student.alertPreferences || "N/A"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {student.alertsEnabled ? (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">
                                Enabled
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                                Disabled
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {student.lastAlertDate
                              ? new Date(student.lastAlertDate).toLocaleDateString()
                              : "Never"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No student engagement data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Alert Impact:</strong> Students receiving deadline alerts have a {correlation?.completionRates?.improvementFactor}% higher goal completion rate.
          </p>
          <p>
            <strong>Engagement:</strong> {correlation?.alertsEnabledCount} out of {correlation?.studentEngagementCount} students ({Math.round((correlation?.alertsEnabledCount || 0) / (correlation?.studentEngagementCount || 1) * 100)}%) have alerts enabled.
          </p>
          <p>
            <strong>Recommendation:</strong> Encourage students to enable alerts and set appropriate reminder timing to maximize goal completion rates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
