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
import {
  Loader2,
  Search,
  Filter,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Check,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminFeedbackDashboard } from "@/components/AdminFeedbackDashboard";

type FilterStatus = "pending" | "approved" | "trial_created" | "completed" | "rejected" | "all";
type SortOption = "newest" | "oldest" | "engagement";

export default function AdminTrialDashboard() {
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkActionDialog, setBulkActionDialog] = useState<"extend" | "convert" | "reject" | null>(null);
  const [extendDays, setExtendDays] = useState(30);

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

  const { data: stats, isLoading: statsLoading } = trpc.trial.getDashboardStats.useQuery();
  const { data: requestsData, isLoading: requestsLoading, refetch } = trpc.trial.getRequestsWithFilters.useQuery({
    page,
    limit: 20,
    status: filterStatus === "all" ? undefined : filterStatus,
    searchTerm: searchTerm || undefined,
    sortBy,
  });

  const requests = requestsData?.requests || [];

  const bulkExtendMutation = trpc.trial.bulkExtendTrials.useMutation();
  const bulkConvertMutation = trpc.trial.bulkConvertTrials.useMutation();
  const bulkRejectMutation = trpc.trial.bulkRejectTrials.useMutation();

  const handleBulkAction = async (action: "extend" | "convert" | "reject") => {
    if (selectedIds.length === 0) {
      console.log({
        title: "No trials selected",
        description: "Please select at least one trial to perform an action.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (action === "extend") {
        await bulkExtendMutation.mutateAsync({ requestIds: selectedIds, additionalDays: extendDays });
        console.log({
          title: "Success",
          description: `Extended ${selectedIds.length} trials by ${extendDays} days`,
        });
      } else if (action === "convert") {
        await bulkConvertMutation.mutateAsync({ requestIds: selectedIds });
        console.log({
          title: "Success",
          description: `Marked ${selectedIds.length} trials as converted`,
        });
      } else if (action === "reject") {
        await bulkRejectMutation.mutateAsync({ requestIds: selectedIds });
        console.log({
          title: "Success",
          description: `Rejected ${selectedIds.length} trials`,
        });
      }
      setSelectedIds([]);
      setBulkActionDialog(null);
      refetch();
    } catch (error) {
      console.log({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r: any) => r.id));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

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
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Trial Management Dashboard</h1>
          <p className="text-muted-foreground">Monitor school trial requests and engagement metrics</p>
        </div>

        {statsLoading ? (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalRequests || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats?.pendingRequests || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats?.activeTrials || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Converted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats?.completedTrials || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by school, district, contact..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
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

        {selectedIds.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{selectedIds.length} trial(s) selected</div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkActionDialog("extend")}
                    disabled={bulkExtendMutation.isPending}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Extend
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkActionDialog("convert")}
                    disabled={bulkConvertMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Convert
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setBulkActionDialog("reject")}
                    disabled={bulkRejectMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedIds([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Trial Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No trial requests found</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === requests.length && requests.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(request.id)}
                            onCheckedChange={() => toggleSelect(request.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.schoolName}</div>
                            {request.district && <div className="text-sm text-muted-foreground">{request.district}</div>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{request.contactName}</div>
                            <div className="text-xs text-muted-foreground">{request.contactEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{request.role.replace("_", " ")}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(request.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feedback Management Section */}
        <div className="mt-8 pt-8 border-t">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold">Feedback Management</h2>
            <p className="text-muted-foreground">Review and respond to trial user feedback</p>
          </div>
          <AdminFeedbackDashboard />
        </div>
      </div>

      <Dialog open={bulkActionDialog === "extend"} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Trials</DialogTitle>
            <DialogDescription>
              Extend {selectedIds.length} trial(s) by how many days?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="number"
              min="1"
              max="90"
              value={extendDays}
              onChange={(e) => setExtendDays(parseInt(e.target.value))}
              placeholder="Days to extend"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setBulkActionDialog(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleBulkAction("extend")}
                disabled={bulkExtendMutation.isPending}
              >
                {bulkExtendMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Extend
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkActionDialog === "convert"} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Converted</DialogTitle>
            <DialogDescription>
              Mark {selectedIds.length} trial(s) as converted to paid?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkActionDialog(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleBulkAction("convert")}
              disabled={bulkConvertMutation.isPending}
            >
              {bulkConvertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkActionDialog === "reject"} onOpenChange={() => setBulkActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Trials</DialogTitle>
            <DialogDescription>
              Reject {selectedIds.length} trial(s)?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkActionDialog(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleBulkAction("reject")}
              disabled={bulkRejectMutation.isPending}
            >
              {bulkRejectMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
