import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertCircle, MessageSquare, Loader2 } from "lucide-react";

type FeedbackStatus = "new" | "reviewed" | "in_progress" | "resolved" | "wont_fix";
type FeedbackType = "bug" | "feature_request" | "usability" | "performance" | "other";
type FeedbackCategory = "game" | "certificates" | "analytics" | "ui" | "mobile" | "other";

interface Feedback {
  id: number;
  feedbackType: FeedbackType;
  category: FeedbackCategory;
  rating?: number;
  title: string;
  description: string;
  status: FeedbackStatus;
  adminNotes?: string;
  createdAt: Date;
  responses?: any[];
}

export function AdminFeedbackDashboard() {
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<FeedbackType | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [newStatus, setNewStatus] = useState<FeedbackStatus>("reviewed");
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch all feedback
  const { data: allFeedback = [], isLoading: feedbackLoading } = trpc.feedback.getAllFeedback.useQuery({
    limit: 200,
    offset: 0,
    status: statusFilter !== "all" ? statusFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  // Fetch feedback stats
  const { data: stats } = trpc.feedback.getFeedbackStats.useQuery();

  // Fetch feedback detail when selected
  const { data: feedbackDetail, isLoading: detailLoading } = trpc.feedback.getFeedbackDetail.useQuery(
    { feedbackId: selectedFeedback?.id || 0 },
    { enabled: !!selectedFeedback?.id }
  );

  // Mutations
  const respondMutation = trpc.feedback.respondToFeedback.useMutation({
    onSuccess: () => {
      setResponseText("");
      setIsPublic(false);
      if (selectedFeedback) {
        setSelectedFeedback(null);
        setTimeout(() => setSelectedFeedback(selectedFeedback), 100);
      }
    },
  });

  const updateStatusMutation = trpc.feedback.updateFeedbackStatus.useMutation({
    onSuccess: () => {
      setNewStatus("reviewed");
      setAdminNotes("");
      if (selectedFeedback) {
        setSelectedFeedback(null);
        setTimeout(() => setSelectedFeedback(selectedFeedback), 100);
      }
    },
  });

  // Filter feedback by search query
  const filteredFeedback = useMemo(() => {
    if (!searchQuery.trim()) return allFeedback;
    const query = searchQuery.toLowerCase();
    return allFeedback.filter(
      (f: any) =>
        f.title.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query)
    );
  }, [allFeedback, searchQuery]);

  const statusCounts = useMemo(() => {
    if (!stats?.byStatus) return {} as Record<FeedbackStatus, number>;
    const counts: Record<FeedbackStatus, number> = {
      new: 0,
      reviewed: 0,
      in_progress: 0,
      resolved: 0,
      wont_fix: 0,
    };
    stats.byStatus.forEach((s: any) => {
      counts[s.status as FeedbackStatus] = s.count;
    });
    return counts;
  }, [stats]);

  const getStatusColor = (status: FeedbackStatus) => {
    switch (status) {
      case "new":
        return "bg-red-100 text-red-800";
      case "reviewed":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "wont_fix":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case "bug":
        return "🐛";
      case "feature_request":
        return "✨";
      case "usability":
        return "🎯";
      case "performance":
        return "⚡";
      default:
        return "💬";
    }
  };

  const handleRespond = () => {
    if (!selectedFeedback || !responseText.trim()) return;
    respondMutation.mutate({
      feedbackId: selectedFeedback.id,
      responseText: responseText.trim(),
      isPublic,
    });
  };

  const handleUpdateStatus = () => {
    if (!selectedFeedback) return;
    updateStatusMutation.mutate({
      feedbackId: selectedFeedback.id,
      status: newStatus,
      adminNotes: adminNotes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {(["new", "reviewed", "in_progress", "resolved", "wont_fix"] as FeedbackStatus[]).map((status) => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 capitalize">{status.replace("_", " ")}</p>
                <p className="text-2xl font-bold text-gray-900">{(statusCounts as Record<FeedbackStatus, number>)[status] || 0}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="wont_fix">Won't Fix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Type</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="usability">Usability</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Category</Label>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="game">Game</SelectItem>
                  <SelectItem value="certificates">Certificates</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="ui">UI</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">Search</Label>
              <Input
                placeholder="Search feedback..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Submissions</CardTitle>
          <CardDescription>{filteredFeedback.length} feedback items</CardDescription>
        </CardHeader>
        <CardContent>
          {feedbackLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : filteredFeedback.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No feedback found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeedback.map((feedback: any) => (
                <Dialog key={feedback.id} open={selectedFeedback?.id === feedback.id} onOpenChange={(open) => {
                  if (!open) setSelectedFeedback(null);
                }}>
                  <DialogTrigger asChild>
                    <div
                      onClick={() => setSelectedFeedback(feedback)}
                      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getTypeIcon(feedback.feedbackType)}</span>
                            <h3 className="font-semibold truncate">{feedback.title}</h3>
                            {feedback.rating && (
                              <span className="text-yellow-500 text-sm">
                                {'★'.repeat(feedback.rating)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{feedback.description}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {feedback.category}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(feedback.status)}`}>
                              {feedback.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <MessageSquare className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  </DialogTrigger>

                  {/* Feedback Detail Dialog */}
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <span>{getTypeIcon(feedback.feedbackType)}</span>
                        {feedback.title}
                      </DialogTitle>
                      <DialogDescription>
                        Submitted on {new Date(feedback.createdAt).toLocaleString()}
                      </DialogDescription>
                    </DialogHeader>

                    {detailLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Feedback Details */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{feedback.description}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Type</p>
                              <Badge variant="outline">{feedback.feedbackType}</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Category</p>
                              <Badge variant="outline">{feedback.category}</Badge>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Status</p>
                              <Badge className={getStatusColor(feedback.status)}>
                                {feedback.status}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Rating</p>
                              <p className="text-sm">
                                {feedback.rating ? `${feedback.rating}/5 ★` : "Not rated"}
                              </p>
                            </div>
                          </div>

                          {feedback.adminNotes && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-xs text-blue-600 font-semibold mb-1">Admin Notes</p>
                              <p className="text-sm text-blue-900">{feedback.adminNotes}</p>
                            </div>
                          )}
                        </div>

                        {/* Responses */}
                        {feedbackDetail?.responses && feedbackDetail.responses.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="font-semibold">Responses</h4>
                            {feedbackDetail.responses.map((response: any) => (
                              <div key={response.id} className="p-3 bg-gray-50 rounded border">
                                <p className="text-sm text-gray-700">{response.responseText}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(response.createdAt).toLocaleString()}
                                  {response.isPublic && " • Public"}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Status Update */}
                        <div className="space-y-3 p-3 bg-gray-50 rounded border">
                          <h4 className="font-semibold text-sm">Update Status</h4>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-sm">New Status</Label>
                              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as FeedbackStatus)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="reviewed">Reviewed</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="wont_fix">Won't Fix</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-sm">Admin Notes</Label>
                              <Textarea
                                placeholder="Add internal notes about this feedback..."
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                rows={2}
                              />
                            </div>

                            <Button
                              onClick={handleUpdateStatus}
                              disabled={updateStatusMutation.isPending}
                              size="sm"
                              className="w-full"
                            >
                              {updateStatusMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                "Update Status"
                              )}
                            </Button>
                          </div>
                        </div>

                        {/* Add Response */}
                        <div className="space-y-3 p-3 bg-blue-50 rounded border border-blue-200">
                          <h4 className="font-semibold text-sm">Add Response</h4>
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Type your response..."
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                            />

                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="isPublic"
                                checked={isPublic}
                                onChange={(e) => setIsPublic(e.target.checked)}
                              />
                              <Label htmlFor="isPublic" className="text-sm cursor-pointer">
                                Make response public (visible to user)
                              </Label>
                            </div>

                            <Button
                              onClick={handleRespond}
                              disabled={respondMutation.isPending || !responseText.trim()}
                              size="sm"
                              className="w-full"
                            >
                              {respondMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                "Send Response"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
