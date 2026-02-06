import React, { useState } from "react";
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
  Brain,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminFeedbackDashboard } from "@/components/AdminFeedbackDashboard";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterStatus = "pending" | "approved" | "trial_created" | "completed" | "rejected" | "all";
type SortOption = "newest" | "oldest";

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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Access Denied
            </CardTitle>
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

  const bulkExtendMutation = trpc.trial.bulkExtendTrials.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedIds([]);
      setBulkActionDialog(null);
    },
  });

  const bulkConvertMutation = trpc.trial.bulkConvertTrials.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedIds([]);
      setBulkActionDialog(null);
    },
  });

  const bulkRejectMutation = trpc.trial.bulkRejectTrials.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedIds([]);
      setBulkActionDialog(null);
    },
  });

  const handleBulkAction = () => {
    if (bulkActionDialog === "extend") {
      bulkExtendMutation.mutate({ ids: selectedIds, days: extendDays });
    } else if (bulkActionDialog === "convert") {
      bulkConvertMutation.mutate({ ids: selectedIds });
    } else if (bulkActionDialog === "reject") {
      bulkRejectMutation.mutate({ ids: selectedIds });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b-2 border-primary sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-primary">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600">Manage trials and school partnerships</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <Tabs defaultValue="trials" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="trials" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Trials</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="text-xs sm:text-sm">
              <MessageSquare className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Feedback</span>
            </TabsTrigger>
          </TabsList>

          {/* Trials Tab */}
          <TabsContent value="trials" className="space-y-6">
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-primary">{stats.totalRequests}</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Active Trials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{stats.activeTrials}</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Expiring Soon</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{stats.expiringTrials}</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Converted</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{stats.convertedTrials}</div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-gray-600">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">
                        {stats.totalRequests > 0 
                          ? ((stats.convertedTrials / stats.totalRequests) * 100).toFixed(1)
                          : 0}%
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters & Search</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by school name or email..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(0);
                      }}
                      className="w-full"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={(value) => {
                    setFilterStatus(value as FilterStatus);
                    setPage(0);
                  }}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="trial_created">Trial Created</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Trials Table */}
            <Card>
              <CardHeader>
                <CardTitle>Trial Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedIds.length === requestsData?.requests.length && requestsData?.requests.length > 0}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedIds(requestsData?.requests.map((r: any) => r.id) || []);
                                } else {
                                  setSelectedIds([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">School</TableHead>
                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Contact</TableHead>
                          <TableHead className="text-xs sm:text-sm">Status</TableHead>
                          <TableHead className="text-xs sm:text-sm">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requestsData?.requests.map((request: any) => (
                          <TableRow key={request.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedIds.includes(request.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedIds([...selectedIds, request.id]);
                                  } else {
                                    setSelectedIds(selectedIds.filter(id => id !== request.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-xs sm:text-sm">{request.schoolName}</TableCell>
                            <TableCell className="hidden sm:table-cell text-xs">{request.contactEmail}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{new Date(request.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <AdminFeedbackDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
