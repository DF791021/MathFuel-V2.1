import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Filter, TrendingUp, Users, CheckCircle, Clock, XCircle } from "lucide-react";

type FilterStatus = "pending" | "approved" | "trial_created" | "completed" | "rejected" | "all";
type SortOption = "newest" | "oldest" | "engagement";

export default function AdminTrialDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(0);

  // Check admin access
  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view this dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = trpc.trial.getDashboardStats.useQuery();

  // Fetch filtered requests
  const { data: requestsData, isLoading: requestsLoading } = trpc.trial.getRequestsWithFilters.useQuery({
    page,
    limit: 20,
    status: filterStatus === "all" ? undefined : filterStatus,
    searchTerm: searchTerm || undefined,
    sortBy,
  });

  const requests = requestsData?.requests || [];

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any; icon: any }> = {
      pending: { label: "Pending", variant: "outline", icon: Clock },
      approved: { label: "Approved", variant: "secondary", icon: CheckCircle },
      trial_created: { label: "Active Trial", variant: "default", icon: TrendingUp },
      completed: { label: "Converted", variant: "default", icon: CheckCircle },
      rejected: { label: "Rejected", variant: "destructive", icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Trial Management Dashboard</h1>
          <p className="text-muted-foreground">Monitor school trial requests and engagement metrics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "-" : stats?.totalRequests}</div>
              <p className="text-xs text-muted-foreground">All trial requests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "-" : stats?.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "-" : stats?.activeTrials}</div>
              <p className="text-xs text-muted-foreground">Currently testing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Converted</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "-" : stats?.completedTrials}</div>
              <p className="text-xs text-muted-foreground">Paid subscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsLoading ? "-" : `${stats?.conversionRate}%`}</div>
              <p className="text-xs text-muted-foreground">Trial to paid</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by school, district, or contact..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={filterStatus} onValueChange={(value) => {
                setFilterStatus(value as FilterStatus);
                setPage(0);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="trial_created">Active Trial</SelectItem>
                  <SelectItem value="completed">Converted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="engagement">Most Engaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Trial Requests</CardTitle>
            <CardDescription>
              {requestsData?.total || 0} request{(requestsData?.total || 0) !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No trial requests found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="font-medium">{request.schoolName}</div>
                          <div className="text-sm text-muted-foreground">{request.district}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{request.contactName}</div>
                          <div className="text-sm text-muted-foreground">{request.contactEmail}</div>
                        </TableCell>
                        <TableCell className="capitalize">{request.role.replace("_", " ")}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell>{formatDate(request.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {(requestsData?.total || 0) > 20 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {page * 20 + 1} to {Math.min((page + 1) * 20, requestsData?.total || 0)} of{" "}
              {requestsData?.total} requests
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={(page + 1) * 20 >= (requestsData?.total || 0)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
