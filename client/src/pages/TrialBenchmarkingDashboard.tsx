import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award } from "lucide-react";

export function TrialBenchmarkingDashboard() {
  const { data: benchmarkData, isLoading } = trpc.trial.getTrialBenchmarking.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40" />
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const getPerformanceColor = (percentile: number) => {
    if (percentile >= 75) return "bg-green-100 text-green-800";
    if (percentile >= 50) return "bg-blue-100 text-blue-800";
    if (percentile >= 25) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  const getPerformanceLabel = (percentile: number) => {
    if (percentile >= 75) return "Top Performer";
    if (percentile >= 50) return "Above Average";
    if (percentile >= 25) return "Average";
    return "Needs Support";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Trial Benchmarking Dashboard</h1>
        <p className="text-gray-600 mt-2">Compare trial school performance against district and state averages</p>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">District Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{benchmarkData?.districtAverage?.gamesPerTrial || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Games per trial</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">State Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{benchmarkData?.stateAverage?.gamesPerTrial || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Games per trial</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Top Performer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{benchmarkData?.topPerformer?.schoolName || "N/A"}</div>
            <p className="text-xs text-gray-500 mt-1">{benchmarkData?.topPerformer?.gamesPerTrial || 0} games</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Case Study Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{benchmarkData?.caseStudyCandidates?.length || 0}</div>
            <p className="text-xs text-gray-500 mt-1">High-engagement pilots</p>
          </CardContent>
        </Card>
      </div>

      {/* Trial School Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Trial School Rankings</CardTitle>
          <CardDescription>Performance comparison against benchmarks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {benchmarkData?.trialSchools && benchmarkData.trialSchools.length > 0 ? (
              benchmarkData.trialSchools.map((school: any, idx: number) => (
                <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{school.schoolName}</h3>
                      <p className="text-sm text-gray-600">Percentile: {school.percentile}%</p>
                    </div>
                    <Badge className={getPerformanceColor(school.percentile)}>
                      {getPerformanceLabel(school.percentile)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Games Played</p>
                      <p className="text-lg font-bold text-gray-900">{school.gamesPerTrial}</p>
                      <p className="text-xs text-gray-500">vs {benchmarkData.districtAverage?.gamesPerTrial || 0} avg</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Certificates</p>
                      <p className="text-lg font-bold text-gray-900">{school.certificatesPerTrial}</p>
                      <p className="text-xs text-gray-500">vs {benchmarkData.districtAverage?.certificatesPerTrial || 0} avg</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Student Engagement</p>
                      <p className="text-lg font-bold text-gray-900">{school.engagementScore}%</p>
                      <p className="text-xs text-gray-500">vs {benchmarkData.districtAverage?.engagementScore || 0}% avg</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min(school.percentile, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No trial data available yet</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Adoption Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Adoption Comparison</CardTitle>
          <CardDescription>How trial schools use features vs benchmarks</CardDescription>
        </CardHeader>
        <CardContent>
          {benchmarkData?.featureComparison && benchmarkData.featureComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={benchmarkData.featureComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="feature" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="trialAverage" fill="#3b82f6" name="Trial Average" />
                <Bar dataKey="districtAverage" fill="#10b981" name="District Average" />
                <Bar dataKey="stateAverage" fill="#f59e0b" name="State Average" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">No feature data available</div>
          )}
        </CardContent>
      </Card>

      {/* Case Study Candidates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Case Study Candidates
          </CardTitle>
          <CardDescription>High-engagement trials perfect for testimonials and success stories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {benchmarkData?.caseStudyCandidates && benchmarkData.caseStudyCandidates.length > 0 ? (
              benchmarkData.caseStudyCandidates.map((candidate: any, idx: number) => (
                <div key={idx} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{candidate.schoolName}</h3>
                      <p className="text-sm text-gray-600">{candidate.district}</p>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">Top Performer</Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Games</p>
                      <p className="font-bold text-gray-900">{candidate.gamesPerTrial}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Certificates</p>
                      <p className="font-bold text-gray-900">{candidate.certificatesPerTrial}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Students</p>
                      <p className="font-bold text-gray-900">{candidate.studentCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Engagement</p>
                      <p className="font-bold text-gray-900">{candidate.engagementScore}%</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{candidate.testimonialQuote}</p>

                  <div className="flex gap-2">
                    <button className="text-sm px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                      Request Testimonial
                    </button>
                    <button className="text-sm px-3 py-1 bg-white border border-yellow-600 text-yellow-600 rounded hover:bg-yellow-50">
                      View Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No case study candidates yet</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Key findings from trial benchmarking data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {benchmarkData?.insights && benchmarkData.insights.length > 0 ? (
              benchmarkData.insights.map((insight: any, idx: number) => (
                <div key={idx} className="flex gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 mt-1">
                    {insight.type === "positive" ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{insight.title}</p>
                    <p className="text-sm text-gray-700">{insight.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">No insights available yet</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
