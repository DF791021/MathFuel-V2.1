/**
 * Notification Toast Component
 * Displays transient notification messages using shadcn/ui toast
 */

import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { NOTIFICATION_ICONS, NOTIFICATION_COLORS } from "@shared/notifications";
import type { NotificationType } from "@shared/notifications";

interface NotificationToastProps {
  type: NotificationType;
  title: string;
  body: string;
  duration?: number;
}

export function NotificationToast({
  type,
  title,
  body,
  duration = 5000,
}: NotificationToastProps) {
  const { toast } = useToast();

  useEffect(() => {
    const icon = NOTIFICATION_ICONS[type];
    const colors = NOTIFICATION_COLORS[type];

    toast({
      title: `${icon} ${title}`,
      description: body,
      duration,
      className: colors,
    });
  }, [type, title, body, duration, toast]);

  return null;
}

/**
 * Hook to show a notification toast
 */
export function useNotificationToast() {
  const { toast } = useToast();

  return (notification: NotificationToastProps) => {
    const icon = NOTIFICATION_ICONS[notification.type];
    const colors = NOTIFICATION_COLORS[notification.type];

    toast({
      title: `${icon} ${notification.title}`,
      description: notification.body,
      duration: notification.duration || 5000,
      className: colors,
    });
  };
}
