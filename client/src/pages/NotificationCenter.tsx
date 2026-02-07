/**
 * Admin Notification Center Page
 * Full list of notifications with filters and pagination
 * Admin-only - parents, teachers, and administrators
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { NOTIFICATION_ICONS, NOTIFICATION_TYPES } from "@shared/notifications";
import { Check, Trash2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRouter } from "wouter";

type FilterType = "all" | "unread" | "payments" | "system" | "account" | "trial";

export function NotificationCenter() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { user } = useAuth();
  const [, navigate] = useRouter();
  const utils = trpc.useUtils();

  // Redirect non-admins
  if (user?.role !== "admin") {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-600 mt-2">Only administrators can view notifications.</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Get all notifications
  const { data: allNotifications = [], isLoading } = trpc.notifications.getAll.useQuery({
    limit: pageSize,
    offset: page * pageSize,
  });

  // Get unread count
  const { data: unreadData } = trpc.notifications.getUnreadCount.useQuery();
  const unreadCount = unreadData?.count || 0;

  // Mutations
  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getAll.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.getUnreadCount.invalidate();
      utils.notifications.getAll.invalidate();
    },
  });

  const dismissMutation = trpc.notifications.dismiss.useMutation({
    onSuccess: () => {
      utils.notifications.getAll.invalidate();
    },
  });

  // Filter notifications
  const filteredNotifications = allNotifications.filter((n: any) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.readAt;
    if (filter === "payments")
      return [
        NOTIFICATION_TYPES.PAYMENT_RECEIVED,
        NOTIFICATION_TYPES.PAYMENT_FAILED,
        NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING,
        NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED,
      ].includes(n.type);
    if (filter === "system")
      return [
        NOTIFICATION_TYPES.SYSTEM_ALERT,
        NOTIFICATION_TYPES.MAINTENANCE_SCHEDULED,
        NOTIFICATION_TYPES.SECURITY_ALERT,
      ].includes(n.type);
    if (filter === "account")
      return [
        NOTIFICATION_TYPES.ACCOUNT_CREATED,
        NOTIFICATION_TYPES.ACCOUNT_UPDATED,
        NOTIFICATION_TYPES.PASSWORD_CHANGED,
        NOTIFICATION_TYPES.EMAIL_CHANGED,
      ].includes(n.type);
    if (filter === "trial")
      return [
        NOTIFICATION_TYPES.TRIAL_STARTING,
        NOTIFICATION_TYPES.TRIAL_EXPIRING,
        NOTIFICATION_TYPES.TRIAL_EXPIRED,
        NOTIFICATION_TYPES.TRIAL_CONVERTED,
      ].includes(n.type);
    return true;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { value: "all" as const, label: "All" },
            { value: "unread" as const, label: `Unread (${unreadCount})` },
            { value: "payments" as const, label: "Payments" },
            { value: "system" as const, label: "System" },
            { value: "account" as const, label: "Account" },
            { value: "trial" as const, label: "Trial" },
          ].map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              onClick={() => {
                setFilter(f.value);
                setPage(0);
              }}
              className="whitespace-nowrap"
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filteredNotifications.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <p>No notifications to display</p>
            </Card>
          ) : (
            filteredNotifications.map((notification: any) => (
              <Card
                key={notification.id}
                className={`p-4 border-l-4 transition-colors ${
                  !notification.readAt ? "bg-blue-50 border-l-blue-500" : "border-l-gray-200"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="text-2xl flex-shrink-0">
                    {NOTIFICATION_ICONS[notification.type as any]}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                        <p className="text-gray-600 mt-1 text-sm">{notification.body}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        {!notification.readAt && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsReadMutation.mutate({ notificationId: notification.id })}
                            disabled={markAsReadMutation.isPending}
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissMutation.mutate({ notificationId: notification.id })}
                          disabled={dismissMutation.isPending}
                          title="Dismiss"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredNotifications.length > 0 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>

            <span className="text-sm text-gray-600">
              Page {page + 1}
            </span>

            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={filteredNotifications.length < pageSize}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
