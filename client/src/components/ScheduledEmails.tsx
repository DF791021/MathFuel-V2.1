import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Mail, Calendar, Trash2, Edit2, Send, User, School, Award, X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ScheduledEmail {
  id: number;
  recipientEmail: string;
  studentName: string;
  teacherName: string | null;
  schoolName: string | null;
  achievementType: string;
  scheduledFor: Date;
  status: string;
  emailSubject: string;
  emailBody: string;
  createdAt: Date;
}

const ACHIEVEMENT_LABELS: Record<string, { label: string; icon: string }> = {
  completion: { label: "Game Completion", icon: "🎮" },
  nutrition_expert: { label: "Nutrition Expert", icon: "🥗" },
  wisconsin_explorer: { label: "Wisconsin Explorer", icon: "🧀" },
  healthy_champion: { label: "Healthy Champion", icon: "💪" },
  food_safety_star: { label: "Food Safety Star", icon: "⭐" },
};

export default function ScheduledEmails() {
  const [editingEmail, setEditingEmail] = useState<ScheduledEmail | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<number | null>(null);
  
  // Edit form states
  const [editRecipientEmail, setEditRecipientEmail] = useState("");
  const [editScheduledDate, setEditScheduledDate] = useState("");
  const [editScheduledTime, setEditScheduledTime] = useState("");
  const [editEmailSubject, setEditEmailSubject] = useState("");
  const [editEmailBody, setEditEmailBody] = useState("");

  const scheduledEmailsQuery = trpc.scheduledEmails.getAll.useQuery();
  const updateMutation = trpc.scheduledEmails.update.useMutation({
    onSuccess: () => {
      toast.success("Scheduled email updated successfully!");
      scheduledEmailsQuery.refetch();
      setIsEditDialogOpen(false);
      setEditingEmail(null);
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });
  
  const deleteMutation = trpc.scheduledEmails.cancel.useMutation({
    onSuccess: () => {
      toast.success("Scheduled email cancelled successfully!");
      scheduledEmailsQuery.refetch();
      setIsDeleteDialogOpen(false);
      setEmailToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to cancel: ${error.message}`);
    },
  });

  const handleEdit = (email: ScheduledEmail) => {
    setEditingEmail(email);
    setEditRecipientEmail(email.recipientEmail);
    const scheduledDate = new Date(email.scheduledFor);
    setEditScheduledDate(scheduledDate.toISOString().split("T")[0]);
    setEditScheduledTime(scheduledDate.toTimeString().slice(0, 5));
    setEditEmailSubject(email.emailSubject);
    setEditEmailBody(email.emailBody);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingEmail) return;
    
    const scheduledAt = new Date(`${editScheduledDate}T${editScheduledTime}`);
    
    if (scheduledAt <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }
    
    updateMutation.mutate({
      id: editingEmail.id,
      scheduledFor: scheduledAt.toISOString(),
      emailSubject: editEmailSubject,
      emailBody: editEmailBody,
    });
  };

  const handleDelete = (id: number) => {
    setEmailToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (emailToDelete) {
      deleteMutation.mutate({ id: emailToDelete });
    }
  };

  const formatDate = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTimeUntil = (dateInput: Date | string) => {
    const now = new Date();
    const scheduled = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const diff = scheduled.getTime() - now.getTime();
    
    if (diff < 0) return "Overdue";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusBadge = (status: string, scheduledFor: Date | string) => {
    const now = new Date();
    const scheduled = typeof scheduledFor === 'string' ? new Date(scheduledFor) : scheduledFor;
    
    if (status === "sent") {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Sent</Badge>;
    }
    if (status === "cancelled") {
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
    }
    if (scheduled < now) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Processing</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>;
  };

  const scheduledEmails = scheduledEmailsQuery.data || [];
  const pendingEmails = scheduledEmails.filter((e: ScheduledEmail) => e.status === "pending");
  const sentEmails = scheduledEmails.filter((e: ScheduledEmail) => e.status === "sent");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Scheduled Emails
          </h2>
          <p className="text-amber-700 mt-1">
            Manage your scheduled certificate emails
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm py-1 px-3">
            {pendingEmails.length} Pending
          </Badge>
          <Badge variant="outline" className="text-sm py-1 px-3 bg-green-50">
            {sentEmails.length} Sent
          </Badge>
        </div>
      </div>

      {/* Empty State */}
      {scheduledEmails.length === 0 && (
        <Card className="border-dashed border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-amber-400 mb-4" />
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              No Scheduled Emails
            </h3>
            <p className="text-amber-700 max-w-md mx-auto">
              When you schedule certificate emails for future delivery, they will appear here.
              Go to the Certificates tab to create and schedule emails.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pending Emails */}
      {pendingEmails.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
            <Send className="w-5 h-5" />
            Pending ({pendingEmails.length})
          </h3>
          <div className="grid gap-4">
            <AnimatePresence>
              {pendingEmails.map((email: ScheduledEmail) => (
                <motion.div
                  key={email.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="border-amber-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        {/* Email Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-xl">
                              {ACHIEVEMENT_LABELS[email.achievementType]?.icon || "🎓"}
                            </div>
                            <div>
                              <h4 className="font-semibold text-amber-900">
                                {email.studentName}
                              </h4>
                              <p className="text-sm text-amber-600">
                                {ACHIEVEMENT_LABELS[email.achievementType]?.label || email.achievementType}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{email.recipientEmail}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <User className="w-4 h-4" />
                              <span>{email.teacherName || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <School className="w-4 h-4" />
                              <span>{email.schoolName || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(email.scheduledFor)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Time & Actions */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <div className="text-lg font-bold text-amber-900">
                              {formatTime(email.scheduledFor)}
                            </div>
                            <div className="text-sm text-amber-600">
                              in {getTimeUntil(email.scheduledFor)}
                            </div>
                          </div>
                          {getStatusBadge(email.status, email.scheduledFor)}
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(email)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(email.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Sent Emails */}
      {sentEmails.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-600 flex items-center gap-2">
            <Check className="w-5 h-5" />
            Sent ({sentEmails.length})
          </h3>
          <div className="grid gap-3">
            {sentEmails.slice(0, 5).map((email: ScheduledEmail) => (
              <Card key={email.id} className="border-gray-200 bg-gray-50/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">{email.studentName}</span>
                        <span className="text-gray-400 mx-2">→</span>
                        <span className="text-gray-600">{email.recipientEmail}</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      Sent {formatDate(email.scheduledFor)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {sentEmails.length > 5 && (
              <p className="text-sm text-gray-500 text-center">
                + {sentEmails.length - 5} more sent emails
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" />
              Edit Scheduled Email
            </DialogTitle>
          </DialogHeader>
          
          {editingEmail && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {ACHIEVEMENT_LABELS[editingEmail.achievementType]?.icon || "🎓"}
                  </span>
                  <div>
                    <p className="font-semibold text-amber-900">{editingEmail.studentName}</p>
                    <p className="text-sm text-amber-700">
                      {ACHIEVEMENT_LABELS[editingEmail.achievementType]?.label}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editRecipientEmail">Recipient Email</Label>
                <Input
                  id="editRecipientEmail"
                  type="email"
                  value={editRecipientEmail}
                  onChange={(e) => setEditRecipientEmail(e.target.value)}
                  placeholder="parent@email.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editScheduledDate">Date</Label>
                  <Input
                    id="editScheduledDate"
                    type="date"
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editScheduledTime">Time</Label>
                  <Input
                    id="editScheduledTime"
                    type="time"
                    value={editScheduledTime}
                    onChange={(e) => setEditScheduledTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmailSubject">Email Subject</Label>
                <Input
                  id="editEmailSubject"
                  value={editEmailSubject}
                  onChange={(e) => setEditEmailSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editEmailBody">Email Body</Label>
                <Textarea
                  id="editEmailBody"
                  value={editEmailBody}
                  onChange={(e) => setEditEmailBody(e.target.value)}
                  rows={5}
                  placeholder="Email content..."
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Cancel Scheduled Email?
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to cancel this scheduled email? This action cannot be undone.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Keep It
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Cancelling..." : "Yes, Cancel Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
