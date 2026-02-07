# Admin Notification System Integration Guide

## Overview

MathFuel's admin notification system is designed for **parents, teachers, and administrators only**. No student-facing notifications exist in Phase 1. The system focuses on informing adults about:

- Payment and subscription events
- Account changes and security alerts
- System maintenance and platform updates
- Trial status changes
- Admin-specific feedback and support tickets

## Philosophy

> Notifications are meant to **inform adults** and **reduce uncertainty**. They never interrupt children. They never gamify alerts. They never create urgency loops. Children experience math, flow, and encouragement—not notifications.

## Architecture

### Database Schema

```
notifications table:
- id (PK)
- adminId (FK to users)
- type (enum of notification types)
- title (string)
- body (text)
- linkUrl (optional)
- metadata (JSON)
- readAt (timestamp, nullable)
- dismissedAt (timestamp, nullable)
- createdAt (timestamp)

adminNotificationPreferences table:
- id (PK)
- adminId (FK to users, unique)
- inAppPayments (boolean)
- inAppSystemAlerts (boolean)
- inAppAccountChanges (boolean)
- emailPayments (boolean)
- emailSystemAlerts (boolean)
- emailAccountChanges (boolean)
- emailDigestFrequency (enum: none, daily, weekly)
- quietHoursStart (time, optional)
- quietHoursEnd (time, optional)
- quietHoursEnabled (boolean)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### Notification Types

**Payment & Subscription:**
- `payment_received` - Payment successfully processed
- `payment_failed` - Payment processing failed
- `subscription_expiring` - Subscription expiring soon
- `subscription_renewed` - Subscription renewed

**Account & Security:**
- `account_created` - New account created
- `account_updated` - Account information updated
- `password_changed` - Password changed
- `email_changed` - Email address changed

**System & Maintenance:**
- `system_alert` - General system alert
- `maintenance_scheduled` - Scheduled maintenance
- `security_alert` - Security alert
- `usage_limit_warning` - Usage limit warning

**Trial:**
- `trial_starting` - Trial period starting
- `trial_expiring` - Trial expiring soon
- `trial_expired` - Trial expired
- `trial_converted` - Trial converted to paid

**Admin-Specific:**
- `feature_released` - New feature released
- `product_update` - Product update
- `policy_changed` - Policy changed
- `new_feedback` - New feedback from users
- `support_ticket_created` - Support ticket created
- `support_ticket_resolved` - Support ticket resolved

## Integration Points

### 1. Payment Events

Trigger notifications when payment events occur:

```typescript
// In payment router/handler
import { createAdminNotification } from "@/server/notifications";

// When payment succeeds
await createAdminNotification({
  adminId: userId,
  type: NOTIFICATION_TYPES.PAYMENT_RECEIVED,
  title: "Payment Received",
  body: `Payment of $${amount} received successfully`,
  linkUrl: "/admin/billing",
  metadata: {
    amount,
    currency,
    transactionId,
  },
});

// When payment fails
await createAdminNotification({
  adminId: userId,
  type: NOTIFICATION_TYPES.PAYMENT_FAILED,
  title: "Payment Failed",
  body: "Your payment could not be processed. Please update your payment method.",
  linkUrl: "/admin/billing",
  metadata: {
    reason,
    retryCount,
  },
});
```

### 2. Subscription Events

Trigger notifications for subscription changes:

```typescript
// When subscription is expiring soon (e.g., 7 days before)
await createAdminNotification({
  adminId: userId,
  type: NOTIFICATION_TYPES.SUBSCRIPTION_EXPIRING,
  title: "Subscription Expiring Soon",
  body: `Your subscription expires on ${expiryDate}. Renew now to avoid interruption.`,
  linkUrl: "/admin/billing",
  metadata: {
    expiryDate,
    daysRemaining,
  },
});

// When subscription renews
await createAdminNotification({
  adminId: userId,
  type: NOTIFICATION_TYPES.SUBSCRIPTION_RENEWED,
  title: "Subscription Renewed",
  body: `Your subscription has been renewed through ${newExpiryDate}`,
  linkUrl: "/admin/billing",
  metadata: {
    renewalDate,
    nextExpiryDate,
  },
});
```

### 3. Account Changes

Trigger notifications for account modifications:

```typescript
// When account is updated
await createAdminNotification({
  adminId: userId,
  type: NOTIFICATION_TYPES.ACCOUNT_UPDATED,
  title: "Account Updated",
  body: "Your account information has been updated",
  linkUrl: "/admin/settings",
  metadata: {
    changedFields: ["email", "name"],
  },
});

// When password is changed
await createAdminNotification({
  adminId: userId,
  type: NOTIFICATION_TYPES.PASSWORD_CHANGED,
  title: "Password Changed",
  body: "Your password has been successfully changed",
  linkUrl: "/admin/settings/security",
  metadata: {
    timestamp: new Date(),
  },
});
```

### 4. System Alerts

Trigger notifications for system events:

```typescript
// Scheduled maintenance
await createAdminNotification({
  adminId: userId,
  type: NOTIFICATION_TYPES.MAINTENANCE_SCHEDULED,
  title: "Scheduled Maintenance",
  body: "Scheduled maintenance on Feb 15 from 2-4 AM EST. Expect brief service interruptions.",
  metadata: {
    maintenanceStart,
    maintenanceEnd,
    expectedDuration,
  },
});

// Security alert
await createAdminNotification({
  adminId: userId,
  type: NOTIFICATION_TYPES.SECURITY_ALERT,
  title: "Security Alert",
  body: "Unusual login detected from new location. If this wasn't you, please secure your account.",
  linkUrl: "/admin/settings/security",
  metadata: {
    location,
    timestamp,
    ipAddress,
  },
});
```

### 5. Trial Events

Trigger notifications for trial status:

```typescript
// Trial starting
await createAdminNotification({
  adminId: userId,
  type: NOTIFICATION_TYPES.TRIAL_STARTING,
  title: "Trial Period Started",
  body: "Your 14-day trial has started. Explore all features!",
  linkUrl: "/admin/dashboard",
  metadata: {
    trialStartDate,
    trialEndDate,
    daysRemaining: 14,
  },
});

// Trial expiring
await createAdminNotification({
  adminId: userId,
  type: NOTIFICATION_TYPES.TRIAL_EXPIRING,
  title: "Trial Expiring Soon",
  body: "Your trial expires in 3 days. Upgrade now to continue using MathFuel.",
  linkUrl: "/admin/billing",
  metadata: {
    daysRemaining: 3,
    trialEndDate,
  },
});

// Trial converted
await createAdminNotification({
  adminId: userId,
  type: NOTIFICATION_TYPES.TRIAL_CONVERTED,
  title: "Trial Converted to Paid",
  body: "Thank you! Your trial has been converted to a paid subscription.",
  linkUrl: "/admin/billing",
  metadata: {
    subscriptionStartDate,
    subscriptionEndDate,
  },
});
```

## UI Components

### NotificationBell Component

Displays in the header for admins only:

```tsx
import { NotificationBell } from "@/components/NotificationBell";

// In header/nav
<NotificationBell />
```

Features:
- Shows unread count badge
- Dropdown with latest 10 notifications
- Quick actions (mark as read, dismiss)
- Link to full notification center

### NotificationCenter Page

Full notification management page:

```tsx
import { NotificationCenter } from "@/pages/NotificationCenter";

// In routes
<Route path="/admin/notifications" component={NotificationCenter} />
```

Features:
- Full notification list with pagination
- Filter by type (payments, system, account, trial)
- Filter by read status
- Mark as read / dismiss actions
- Responsive design

## tRPC Procedures

All notification operations are exposed via tRPC:

```typescript
// Get unread notifications
trpc.notifications.getUnread.useQuery({ limit: 10 });

// Get all notifications with pagination
trpc.notifications.getAll.useQuery({ limit: 20, offset: 0 });

// Get notifications by type
trpc.notifications.getByType.useQuery({ type: "payment_received", limit: 20 });

// Get unread count
trpc.notifications.getUnreadCount.useQuery();

// Mark as read
trpc.notifications.markAsRead.useMutation({ notificationId: 1 });

// Mark all as read
trpc.notifications.markAllAsRead.useMutation();

// Dismiss notification
trpc.notifications.dismiss.useMutation({ notificationId: 1 });

// Get preferences
trpc.notifications.getPreferences.useQuery();

// Update preferences
trpc.notifications.updatePreferences.useMutation({
  inAppPayments: false,
  emailSystemAlerts: true,
  emailDigestFrequency: "daily",
});

// Send test notification
trpc.notifications.sendTest.useMutation();
```

## Notification Preferences Page

Create a settings page where admins can customize preferences:

```tsx
// client/src/pages/NotificationPreferences.tsx
export function NotificationPreferences() {
  const { data: prefs } = trpc.notifications.getPreferences.useQuery();
  const updateMutation = trpc.notifications.updatePreferences.useMutation();

  return (
    <div className="space-y-6">
      <section>
        <h2>In-App Notifications</h2>
        <Checkbox
          label="Payment notifications"
          checked={prefs?.inAppPayments}
          onChange={(val) =>
            updateMutation.mutate({ inAppPayments: val })
          }
        />
        <Checkbox
          label="System alerts"
          checked={prefs?.inAppSystemAlerts}
          onChange={(val) =>
            updateMutation.mutate({ inAppSystemAlerts: val })
          }
        />
        <Checkbox
          label="Account changes"
          checked={prefs?.inAppAccountChanges}
          onChange={(val) =>
            updateMutation.mutate({ inAppAccountChanges: val })
          }
        />
      </section>

      <section>
        <h2>Email Notifications</h2>
        <Checkbox
          label="Payment notifications"
          checked={prefs?.emailPayments}
          onChange={(val) =>
            updateMutation.mutate({ emailPayments: val })
          }
        />
        <Checkbox
          label="System alerts"
          checked={prefs?.emailSystemAlerts}
          onChange={(val) =>
            updateMutation.mutate({ emailSystemAlerts: val })
          }
        />
        <Checkbox
          label="Account changes"
          checked={prefs?.emailAccountChanges}
          onChange={(val) =>
            updateMutation.mutate({ emailAccountChanges: val })
          }
        />
        <Select
          label="Email digest frequency"
          value={prefs?.emailDigestFrequency}
          options={["none", "daily", "weekly"]}
          onChange={(val) =>
            updateMutation.mutate({
              emailDigestFrequency: val as any,
            })
          }
        />
      </section>

      <section>
        <h2>Quiet Hours</h2>
        <Checkbox
          label="Enable quiet hours"
          checked={prefs?.quietHoursEnabled}
          onChange={(val) =>
            updateMutation.mutate({ quietHoursEnabled: val })
          }
        />
        {prefs?.quietHoursEnabled && (
          <>
            <TimeInput
              label="Start time"
              value={prefs?.quietHoursStart}
              onChange={(val) =>
                updateMutation.mutate({ quietHoursStart: val })
              }
            />
            <TimeInput
              label="End time"
              value={prefs?.quietHoursEnd}
              onChange={(val) =>
                updateMutation.mutate({ quietHoursEnd: val })
              }
            />
          </>
        )}
      </section>

      <Button onClick={() => updateMutation.mutate({})}>
        Send Test Notification
      </Button>
    </div>
  );
}
```

## Testing

Run notification tests:

```bash
pnpm test -- server/notifications.test.ts
```

Tests verify:
- All notification types exist
- No student-facing notification types
- Admin-only focus
- Proper type definitions

## Phase 2 Considerations

When expanding notifications in Phase 2, consider:

1. **Email Delivery** - Integrate with email service (SendGrid, Mailgun)
2. **Digest Emails** - Batch notifications into daily/weekly digests
3. **Quiet Hours** - Respect admin's quiet hours settings
4. **Webhooks** - Allow external systems to trigger notifications
5. **Analytics** - Track notification delivery and engagement
6. **Retry Logic** - Handle failed deliveries with exponential backoff

## Best Practices

1. **Always include context** - Notifications should include enough info to understand the event
2. **Include action links** - Provide direct links to relevant pages
3. **Use metadata** - Store structured data for future analytics
4. **Respect preferences** - Check admin preferences before sending
5. **Avoid notification fatigue** - Batch related events when possible
6. **Test thoroughly** - Use the test notification feature before deploying
7. **Monitor delivery** - Track notification delivery rates and failures

## Troubleshooting

**Notifications not appearing:**
- Check if admin has notifications enabled in preferences
- Verify quiet hours are not active
- Check browser console for errors

**Notifications appearing for students:**
- Verify role check in NotificationBell component
- Ensure only admins can access notification pages
- Check that student notification types don't exist

**Performance issues:**
- Paginate notifications queries
- Add database indexes on (adminId, createdAt)
- Consider archiving old notifications
