# Payment Notifications Integration Guide

## Overview

The payment notification system integrates with MathFuel's admin-only notification infrastructure to send real-time alerts for payment events. This guide documents the complete integration and how to use it.

## Architecture

```
Payment Event (Stripe)
    ↓
Stripe Webhook (/api/stripe/webhook)
    ↓
handleStripeWebhook (stripeWebhook.ts)
    ↓
Event Handler (e.g., handleCheckoutSessionCompleted)
    ↓
Payment Notification Helper (paymentNotifications.ts)
    ↓
createAdminNotification (notifications.ts)
    ↓
Admin Notification Center (UI)
```

## Payment Events Supported

### 1. Payment Confirmation (`payment_success`)
**Triggered when:** Payment is successfully processed
**Recipients:** Admin/school administrator
**Data included:**
- Amount and currency
- Tier (school/district)
- Billing interval (monthly/annual)
- Customer email and name
- Session ID for tracking

**Example:**
```
Title: "Payment Confirmed ✓"
Body: "Annual School License subscription activated. Amount: $999.00 USD. Customer: school@example.com"
Link: /admin/payments?session=cs_test_123
```

### 2. Payment Failure (`payment_failed`)
**Triggered when:** Payment is declined or fails
**Recipients:** Admin/school administrator
**Data included:**
- Amount and currency
- Tier (school/district)
- Billing interval (monthly/annual)
- Customer email and name
- Failure reason (e.g., "Card declined")
- Session ID for tracking

**Example:**
```
Title: "Payment Failed ✗"
Body: "Monthly District License subscription failed. Amount: $999.00 USD. Reason: Card declined. Customer: district@example.com"
Link: /admin/payments?session=cs_test_456&status=failed
```

### 3. Subscription Renewal (`subscription_renewal`)
**Triggered when:** Subscription is about to renew (within 7 days)
**Recipients:** Admin/school administrator
**Data included:**
- Amount and currency
- Tier (school/district)
- Billing interval (monthly/annual)
- Customer email and name
- Renewal date
- Subscription ID

**Example:**
```
Title: "Subscription Renewing Soon"
Body: "School License subscription renews on 2/13/2026. Amount: $499.00 USD. Customer: school@example.com"
Link: /admin/payments?subscription=sub_test_123
```

### 4. Subscription Cancellation (`subscription_cancelled`)
**Triggered when:** Subscription is cancelled
**Recipients:** Admin/school administrator
**Data included:**
- Tier (school/district)
- Customer email and name
- Cancellation reason
- Subscription ID

**Example:**
```
Title: "Subscription Cancelled"
Body: "School License subscription cancelled for school@example.com. Reason: User requested cancellation"
Link: /admin/payments?subscription=sub_test_789&status=cancelled
```

### 5. Refund Issued (`refund_issued`)
**Triggered when:** Refund is processed
**Recipients:** Admin/school administrator
**Data included:**
- Refund amount and currency
- Customer email and name
- Refund reason
- Charge ID and refund ID

**Example:**
```
Title: "Refund Issued"
Body: "Refund of $999.00 USD issued to school@example.com. Reason: Duplicate charge"
Link: /admin/payments?refund=re_test_123
```

### 6. Payment Method Updated (`account_change`)
**Triggered when:** Payment method is updated
**Recipients:** Admin/school administrator
**Data included:**
- Customer email and name
- Payment method type
- Last 4 digits (if applicable)

**Example:**
```
Title: "Payment Method Updated"
Body: "Payment method updated for school@example.com. New method: card ending in 4242"
Link: /admin/payments?customer=school@example.com
```

## Implementation Details

### File Structure

```
server/
  paymentNotifications.ts          # Helper functions for sending notifications
  paymentNotifications.test.ts     # Unit tests (33 tests)
  routers/
    payment.ts                     # Integrated with payment procedures
  _core/
    stripeWebhook.ts              # Webhook handler
    index.ts                       # Webhook endpoint registration
```

### Key Functions

#### `sendPaymentConfirmationNotification(paymentData)`
Sends a notification when payment is confirmed.

```typescript
await sendPaymentConfirmationNotification({
  amount: 99900,                    // in cents
  currency: "usd",
  tier: "school",
  billingInterval: "annual",
  customerEmail: "school@example.com",
  customerName: "Example School",
  sessionId: "cs_test_123",
});
```

#### `sendPaymentFailureNotification(paymentData)`
Sends a notification when payment fails.

```typescript
await sendPaymentFailureNotification({
  amount: 99900,
  currency: "usd",
  tier: "district",
  billingInterval: "month",
  customerEmail: "district@example.com",
  customerName: "Example District",
  failureReason: "Card declined",
  sessionId: "cs_test_456",
});
```

#### `sendSubscriptionRenewalNotification(paymentData)`
Sends a notification when subscription is about to renew.

```typescript
await sendSubscriptionRenewalNotification({
  amount: 49900,
  currency: "usd",
  tier: "school",
  billingInterval: "month",
  customerEmail: "school@example.com",
  customerName: "Example School",
  renewalDate: new Date("2026-02-13"),
  subscriptionId: "sub_test_123",
});
```

#### `sendSubscriptionCancellationNotification(paymentData)`
Sends a notification when subscription is cancelled.

```typescript
await sendSubscriptionCancellationNotification({
  tier: "school",
  customerEmail: "school@example.com",
  customerName: "Example School",
  cancellationReason: "User requested cancellation",
  subscriptionId: "sub_test_789",
});
```

#### `sendRefundNotification(paymentData)`
Sends a notification when refund is issued.

```typescript
await sendRefundNotification({
  amount: 99900,
  currency: "usd",
  customerEmail: "school@example.com",
  customerName: "Example School",
  refundReason: "Duplicate charge",
  chargeId: "ch_test_123",
  refundId: "re_test_123",
});
```

#### `sendPaymentMethodUpdateNotification(paymentData)`
Sends a notification when payment method is updated.

```typescript
await sendPaymentMethodUpdateNotification({
  customerEmail: "school@example.com",
  customerName: "Example School",
  paymentMethodType: "card",
  last4: "4242",
});
```

### Webhook Events Handled

The Stripe webhook handler (`handleStripeWebhook`) processes these Stripe events:

1. `checkout.session.completed` → Payment confirmation
2. `payment_intent.succeeded` → Payment confirmation
3. `payment_intent.payment_failed` → Payment failure
4. `customer.subscription.created` → Subscription confirmation
5. `customer.subscription.updated` → Subscription renewal check
6. `customer.subscription.deleted` → Subscription cancellation
7. `charge.refunded` → Refund issued
8. `invoice.paid` → Invoice payment confirmation
9. `invoice.payment_failed` → Invoice payment failure

### Notification Preferences

Admins can control which payment notifications they receive via the `adminNotificationPreferences` table:

```typescript
interface AdminNotificationPreferences {
  adminId: number;
  inAppPayments: boolean;              // Receive in-app payment notifications
  inAppSystemAlerts: boolean;          // Receive system alerts
  inAppAccountChanges: boolean;        // Receive account change notifications
  emailPayments: boolean;              // Receive email payment notifications
  emailSystemAlerts: boolean;          // Receive email system alerts
  emailAccountChanges: boolean;        // Receive email account changes
  emailDigestFrequency: "immediate" | "daily" | "weekly";
  quietHoursEnabled: boolean;
  quietHoursStart?: string;            // HH:MM format
  quietHoursEnd?: string;              // HH:MM format
}
```

## Testing

### Unit Tests
Run payment notification tests:

```bash
pnpm test server/paymentNotifications.test.ts
```

**Test Coverage:**
- 33 tests covering:
  - Notification type validation
  - Metadata structure verification
  - Title and body formatting
  - Link URL generation
  - Tier and billing information formatting
  - Preference checking
  - Error handling

### Manual Testing with Stripe Webhooks

1. **Test Event Detection:**
   - Stripe test events (ID starting with `evt_test_`) are automatically detected and verified
   - No actual notifications are created for test events

2. **Using Stripe CLI:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger payment_intent.succeeded
   ```

3. **Webhook Verification:**
   - All webhooks are verified using `stripe.webhooks.constructEvent()`
   - Invalid signatures are rejected with 400 status
   - Missing webhook secret returns 500 status

## Integration Points

### 1. Payment Router (`server/routers/payment.ts`)
- `getCheckoutSession` - Sends confirmation notification when payment is successful
- `updateBillingInfo` - Sends account change notification
- `cancelSubscription` - Logs cancellation (can be extended to send notification)

### 2. Stripe Webhook Handler (`server/_core/stripeWebhook.ts`)
- Registered at `/api/stripe/webhook`
- Processes all Stripe events
- Calls appropriate payment notification functions

### 3. Admin Notification System (`server/notifications.ts`)
- `createAdminNotification()` - Creates notification in database
- `getAdminNotificationPreferences()` - Retrieves admin preferences
- Respects admin's notification settings

## Error Handling

All payment notification functions include error handling:

```typescript
try {
  await sendPaymentConfirmationNotification(paymentData);
} catch (error) {
  console.error("Failed to send payment confirmation notification:", error);
  // Payment should succeed even if notification fails
}
```

**Key principles:**
- Notifications are non-blocking (don't affect payment processing)
- Errors are logged but don't throw
- Admin user lookup failures are handled gracefully
- Missing preferences default to safe values

## Future Enhancements

1. **Email Notifications**
   - Extend system to send email alongside in-app notifications
   - Implement email templates for each notification type
   - Support digest frequency (immediate, daily, weekly)

2. **Notification Preferences UI**
   - Create settings page for admins to customize notifications
   - Allow quiet hours configuration
   - Support per-event notification preferences

3. **Advanced Filtering**
   - Filter notifications by tier (school/district)
   - Filter by amount threshold
   - Filter by billing interval

4. **Notification History**
   - Archive old notifications
   - Search and filter notification history
   - Export notification reports

5. **Webhook Retry Logic**
   - Implement exponential backoff for failed webhooks
   - Add webhook delivery status tracking
   - Support webhook replay from Stripe dashboard

## Troubleshooting

### Notifications not appearing

1. **Check admin user exists:**
   ```sql
   SELECT * FROM users WHERE role = 'admin' LIMIT 1;
   ```

2. **Check notification preferences:**
   ```sql
   SELECT * FROM adminNotificationPreferences WHERE adminId = 1;
   ```

3. **Check notification table:**
   ```sql
   SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 10;
   ```

4. **Check server logs:**
   - Look for "Payment confirmation notification sent"
   - Look for error messages in console

### Webhook not triggering

1. **Verify webhook secret:**
   - Check `STRIPE_WEBHOOK_SECRET` environment variable
   - Verify it matches Stripe dashboard

2. **Check webhook endpoint:**
   - Verify `/api/stripe/webhook` is registered
   - Verify it's registered BEFORE `express.json()`

3. **Test webhook delivery:**
   - Use Stripe CLI: `stripe listen`
   - Check Stripe dashboard → Developers → Webhooks

### Notification preferences not respected

1. **Verify preferences table:**
   - Check `adminNotificationPreferences` table exists
   - Verify preferences are set correctly

2. **Check preference lookup:**
   - Verify `getAdminNotificationPreferences()` is called
   - Check that preferences are loaded before notification creation

## Support

For issues or questions about payment notifications:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Check Stripe webhook delivery status in dashboard
4. Review test coverage in `paymentNotifications.test.ts`
