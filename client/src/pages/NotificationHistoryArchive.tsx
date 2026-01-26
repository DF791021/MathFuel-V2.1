import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Download,
  TrendingUp,
  AlertTriangle,
  Calendar,
  FileText,
  BarChart3,
} from "lucide-react";

export default function NotificationHistoryArchive() {
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");

  // Queries
  const { data: history, isLoading: historyLoading } =
    trpc.notificationArchive.getHistoryByDateRange.useQuery(
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        limit: 100,
      },
      { enabled: !!startDate && !!endDate }
    );

  const { data: stats, isLoading: statsLoading } =
    trpc.notificationArchive.getStatsByDateRange.useQuery(
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      { enabled: !!startDate && !!endDate }
    );

  const { data: trends, isLoading: trendsLoading } =
    trpc.notificationArchive.getTrends.useQuery(
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        groupBy,
      },
      { enabled: !!startDate && !!endDate }
    );

  const { data: highPriority, isLoading: highPriorityLoading } =
    trpc.notificationArchive.getHighPriority.useQuery(
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      { enabled: !!startDate && !!endDate }
    );

  // Mutations
  const exportCSVMutation = trpc.notificationArchive.exportAsCSV.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: false }
  );

  const exportJSONMutation = trpc.notificationArchive.exportAsJSON.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: false }
  );

  const complianceReportMutation =
    trpc.notificationArchive.generateComplianceReport.useQuery(
      {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
      { enabled: false }
    );

  const auditTrailMutation = trpc.notificationArchive.generateAuditTrail.useQuery(
    {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
    { enabled: false }
  );

  const handleExport = async (format: "csv" | "json" | "compliance" | "audit") => {
    try {
      let data: any;
      let filename: string;

      if (format === "csv") {
        const result = await exportCSVMutation.refetch();
        if (!result.data?.data) throw new Error("Export failed");
        data = result.data.data;
        filename = result.data.filename;
      } else if (format === "json") {
        const result = await exportJSONMutation.refetch();
        if (!result.data?.data) throw new Error("Export failed");
        data = result.data.data;
        filename = result.data.filename;
      } else if (format === "compliance") {
        const result = await complianceReportMutation.refetch();
        if (!result.data?.data) throw new Error("Export failed");
        data = result.data.data;
        filename = result.data.filename;
      } else {
        const result = await auditTrailMutation.refetch();
        if (!result.data?.data) throw new Error("Export failed");
        data = result.data.data;
        filename = result.data.filename;
      }

      // Create blob and download
      const blob = new Blob([data], {
        type: format === "json" ? "application/json" : "text/plain",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported ${filename}`);
    } catch (error) {
      toast.error("Export failed");
    }
  };

  const isLoading = historyLoading || statsLoading || trendsLoading;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notification History Archive</h1>
          <p className="text-muted-foreground mt-2">
            View, filter, and export notification history for auditing and compliance reporting.
          </p>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Date Range Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {stats && !isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">{stats.total}</div>
                  <p className="text-sm text-muted-foreground">Total Notifications</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.read}</div>
                  <p className="text-sm text-muted-foreground">Read</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">{stats.unread}</div>
                  <p className="text-sm text-muted-foreground">Unread</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.emailSent}</div>
                  <p className="text-sm text-muted-foreground">Email Sent</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Notification Types Breakdown */}
        {stats && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Notifications by Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.byType).map(([type, count]: [string, any]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="capitalize font-medium">{type}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* High Priority Items */}
        {highPriority && highPriority.length > 0 && !highPriorityLoading && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="w-5 h-5" />
                High Priority Items ({highPriority.length})
              </CardTitle>
              <CardDescription className="text-amber-800">
                Low ratings, bugs, and critical feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {highPriority.slice(0, 10).map((item: any) => (
                  <div key={item.id} className="p-3 bg-white rounded-lg border border-amber-200">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-amber-900">{item.title}</p>
                        <p className="text-sm text-amber-800">{item.message}</p>
                      </div>
                      <Badge variant="destructive">{item.type}</Badge>
                    </div>
                    <p className="text-xs text-amber-700 mt-2">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trends */}
        {trends && trends.length > 0 && !trendsLoading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Notification Trends
              </CardTitle>
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Group By</label>
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-lg"
                >
                  <option value="day">Daily</option>
                  <option value="week">Weekly</option>
                  <option value="month">Monthly</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {trends.map((point: any) => (
                  <div key={point.date} className="flex items-center justify-between">
                    <span className="text-sm">{point.date}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-6 bg-blue-100 rounded" style={{width: `${Math.max(point.count * 5, 32)}px`}}></div>
                      <span className="font-semibold">{point.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export & Reports
            </CardTitle>
            <CardDescription>
              Download notification data in various formats for analysis and compliance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={() => handleExport("csv")}
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
              <Button
                onClick={() => handleExport("json")}
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as JSON
              </Button>
              <Button
                onClick={() => handleExport("compliance")}
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Compliance Report
              </Button>
              <Button
                onClick={() => handleExport("audit")}
                variant="outline"
                className="w-full justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                Audit Trail
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification List */}
        {history && history.length > 0 && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Notification History ({history.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((item: any) => (
                  <div key={item.id} className="p-3 border border-border rounded-lg hover:bg-muted/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.message}</p>
                      </div>
                      <div className="flex gap-1">
                        <Badge variant={item.isRead ? "secondary" : "default"}>
                          {item.isRead ? "Read" : "Unread"}
                        </Badge>
                        <Badge variant="outline">{item.type}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
