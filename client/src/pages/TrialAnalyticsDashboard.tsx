import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export function TrialAnalyticsDashboard() {
  const { data: conversionData, isLoading: conversionLoading } = trpc.trial.getConversionAnalytics.useQuery();
  const { data: featureData, isLoading: featureLoading } = trpc.trial.getFeatureAdoption.useQuery();
  const { data: timelineData, isLoading: timelineLoading } = trpc.trial.getTrialTimeline.useQuery({ days: 30 });

  const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#3b82f6"];

  if (conversionLoading || featureLoading || timelineLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionData?.totalRequests || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Trial requests submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Trials Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionData?.trialCreated || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Active trial accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionData?.completed || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Paid customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{conversionData?.conversionRate || 0}%</div>
            <p className="text-xs text-gray-500 mt-1">Requests to paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Trial Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionData?.avgTrialDuration || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Days in trial</p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Trial request to paid customer journey</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversionData?.conversionFunnel && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Requests</span>
                    <span className="text-sm font-bold">{conversionData.conversionFunnel.requests}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div className="bg-blue-500 h-full flex items-center justify-center text-white text-xs font-bold" style={{ width: "100%" }}>
                      100%
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Trials Created</span>
                    <span className="text-sm font-bold">{conversionData.conversionFunnel.trialsCreated}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-amber-500 h-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${(conversionData.conversionFunnel.trialsCreated / conversionData.conversionFunnel.requests) * 100}%` }}
                    >
                      {Math.round((conversionData.conversionFunnel.trialsCreated / conversionData.conversionFunnel.requests) * 100)}%
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Converted to Paid</span>
                    <span className="text-sm font-bold">{conversionData.conversionFunnel.converted}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-green-500 h-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ width: `${(conversionData.conversionFunnel.converted / conversionData.conversionFunnel.requests) * 100}%` }}
                    >
                      {Math.round((conversionData.conversionFunnel.converted / conversionData.conversionFunnel.requests) * 100)}%
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Adoption */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Adoption</CardTitle>
          <CardDescription>How trial users engage with key features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Games Played</span>
                  <span className="font-bold">{featureData?.totalGamesPlayed || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min((featureData?.totalGamesPlayed || 0) / 100, 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Certificates Generated</span>
                  <span className="font-bold">{featureData?.totalCertificatesGenerated || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min((featureData?.totalCertificatesGenerated || 0) / 100, 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Emails Sent</span>
                  <span className="font-bold">{featureData?.totalEmailsSent || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${Math.min((featureData?.totalEmailsSent || 0) / 100, 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>PDF Exports</span>
                  <span className="font-bold">{featureData?.totalPdfExports || 0}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${Math.min((featureData?.totalPdfExports || 0) / 100, 100)}%` }}></div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg Games per Trial</p>
                <p className="text-2xl font-bold text-blue-600">{featureData?.avgGamesPerTrial || 0}</p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg Certificates per Trial</p>
                <p className="text-2xl font-bold text-green-600">{featureData?.avgCertificatesPerTrial || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trial Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Trial Requests Timeline</CardTitle>
          <CardDescription>New trial requests over the past 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {timelineData && timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" name="New Requests" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">No timeline data available</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
