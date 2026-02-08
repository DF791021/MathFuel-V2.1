# TypeScript Error Triage Report

**Total Errors:** 88
**Date:** 2025-02-07

## Category A: Build/Deployment Blockers (MUST FIX NOW)

These errors will fail `tsc --noEmit` and block production builds.

### 1. **server/routers/payment.ts:55,56** - CRITICAL (OAuth/Session)
- **Error:** `Type 'string | null' is not assignable to type 'string | undefined'`
- **Context:** Stripe session creation with OAuth context
- **Impact:** Blocks payment flow and session handling
- **Fix Strategy:** Tighten session type - ensure `ctx.user.email` is always `string`, never `null`
- **Status:** BLOCKER - touches auth/session

### 2. **server/routers/payment.ts:19,3** - CRITICAL
- **Error:** `Type '"2024-11-20"' is not assignable to type '"2025-12-15.clover"'`
- **Context:** Price ID constant mismatch
- **Impact:** Payment configuration broken
- **Fix Strategy:** Update price ID constant to match schema
- **Status:** BLOCKER - payment critical path

### 3. **server/_core/stripeWebhook.ts:226,52** - HIGH (Auth/Webhook)
- **Error:** Type mismatch in webhook event handling
- **Context:** Stripe webhook signature verification
- **Impact:** Webhooks may not process correctly
- **Fix Strategy:** Verify webhook types match Stripe SDK
- **Status:** BLOCKER - touches payment webhooks

### 4. **server/_core/stripeWebhook.ts:18,3** - HIGH
- **Error:** Configuration type error
- **Context:** Stripe webhook setup
- **Impact:** Webhook initialization may fail
- **Fix Strategy:** Align Stripe config types
- **Status:** BLOCKER - webhook critical

### 5. **drizzle/schema.ts:187-188** - MEDIUM
- **Error:** Schema column type mismatch
- **Context:** Database schema definition
- **Impact:** May cause migration issues
- **Fix Strategy:** Fix column type definitions
- **Status:** BLOCKER - schema critical

---

## Category B: Security/Auth/Session Correctness Issues (MUST FIX NOW)

These don't fail the build but affect auth/RBAC correctness.

### 1. **server/notifications.ts** (8 errors)
- **Lines:** 20, 47, 71, 96 (2x), 116, 153, 193
- **Error:** `notificationPreferences` schema mismatch
- **Context:** Admin notification preferences
- **Impact:** Notification preferences won't work correctly
- **Fix Strategy:** Update to use `adminNotificationPreferences` table
- **Status:** CRITICAL - affects admin features

### 2. **server/paymentNotifications.ts** (9 errors)
- **Lines:** 59, 70, 119, 179, 190, 236, 248, 293, 302, 346, 357
- **Error:** Missing/wrong notification types and schema fields
- **Context:** Payment notification logic
- **Impact:** Payment notifications won't send correctly
- **Fix Strategy:** Align notification types with schema
- **Status:** CRITICAL - affects payment notifications

### 3. **server/db.ts:4315,7** - MEDIUM
- **Error:** Schema reference error
- **Context:** Database query helpers
- **Impact:** Some queries may fail
- **Fix Strategy:** Update schema references
- **Status:** BLOCKER - db critical

### 4. **server/_core/notificationExport.ts:1,23** - MEDIUM
- **Error:** Import error
- **Context:** Notification export utility
- **Impact:** Export feature broken
- **Fix Strategy:** Fix import path
- **Status:** BLOCKER - export feature

---

## Category C: Harmless Type Noise (LOG & DEFER)

These are type annotation issues that don't affect runtime behavior. Safe to defer.

### Client-side Type Noise (54 errors)

**Files affected:**
- `client/src/pages/ParentDashboard.tsx` (6 errors)
- `client/src/pages/ProgressTrackingDashboard.tsx` (4 errors)
- `client/src/pages/ParentTeacherMessaging.tsx` (4 errors)
- `client/src/pages/HomePracticeView.tsx` (4 errors)
- `client/src/pages/AdminTrialDashboard.tsx` (5 errors)
- `client/src/pages/AdminNotificationPreferences.tsx` (10 errors)
- `client/src/pages/NotificationHistoryArchive.tsx` (8 errors)
- `client/src/pages/NotificationCenter.tsx` (2 errors)
- `client/src/pages/Home.tsx` (1 error)
- `client/src/pages/Pricing.tsx` (2 errors)
- `client/src/pages/TeacherPortal.tsx` (2 errors)
- `client/src/components/Testimonials.tsx` (1 error)
- `client/src/components/NotificationToast.tsx` (1 error)
- `client/src/components/NotificationBell.tsx` (2 errors)

**Pattern:** React hook type inference issues (useQuery, useMutation, etc.)
**Fix Strategy:** Add explicit type parameters to tRPC hooks
**Priority:** DEFER - doesn't affect runtime, only IDE hints

---

## Action Plan

### Phase 1: Fix Blockers (Category A + B)
1. Fix `server/routers/payment.ts` - session type, price ID
2. Fix `server/_core/stripeWebhook.ts` - webhook types
3. Fix `server/notifications.ts` - schema references
4. Fix `server/paymentNotifications.ts` - notification types
5. Fix `drizzle/schema.ts` - column types
6. Fix `server/db.ts` - schema references
7. Fix `server/_core/notificationExport.ts` - imports

**Estimated Time:** 30-45 minutes

### Phase 2: Continue Revenue Engine Build
- Admin panel (/admin route)
- Email notifications (Resend)
- Observability (Sentry, Pino)
- Health endpoint

### Phase 3: Clean Up Type Noise (Category C)
- Add explicit type parameters to React hooks
- Estimated time: 1-2 hours
- Can be done in parallel or deferred to next sprint

---

## TypeScript Debt Backlog

| File | Error Code | Line | Issue | Fix Strategy |
|------|-----------|------|-------|--------------|
| client/src/pages/ParentDashboard.tsx | TS2769 | 29, 89, 97, 105 | Hook type inference | Add `<ReturnType>` to useQuery |
| client/src/pages/ProgressTrackingDashboard.tsx | TS2769 | 30, 78 | Hook type inference | Add explicit type params |
| client/src/pages/ParentTeacherMessaging.tsx | TS2769 | 23, 69, 82, 115 | Hook type inference | Add explicit type params |
| client/src/pages/HomePracticeView.tsx | TS2769 | 15, 32, 72 | Hook type inference | Add explicit type params |
| client/src/pages/AdminTrialDashboard.tsx | TS2769 | 114-230 | Multiple hook issues | Batch fix with type params |
| client/src/pages/AdminNotificationPreferences.tsx | TS2769 | 14-39 | Hook type inference | Add explicit type params |
| client/src/pages/NotificationHistoryArchive.tsx | TS2769 | 29-92 | Hook type inference | Add explicit type params |
| client/src/pages/NotificationCenter.tsx | TS2769 | 24, 176 | Hook type inference | Add explicit type params |
| client/src/pages/Home.tsx | TS2769 | 233 | Hook type inference | Add explicit type params |
| client/src/pages/Pricing.tsx | TS2769 | 50-51 | Hook type inference | Add explicit type params |
| client/src/pages/TeacherPortal.tsx | TS2769 | 352, 379 | Hook type inference | Add explicit type params |
| client/src/components/Testimonials.tsx | TS2769 | 179 | Hook type inference | Add explicit type params |
| client/src/components/NotificationToast.tsx | TS2769 | 7 | Hook type inference | Add explicit type params |
| client/src/components/NotificationBell.tsx | TS2769 | 17, 122 | Hook type inference | Add explicit type params |

---

## Summary

- **Blockers to fix NOW:** 13 errors (Categories A + B)
- **Type noise to defer:** 54 errors (Category C)
- **Estimated fix time:** 30-45 minutes for blockers
- **Recommendation:** Fix blockers, continue revenue engine build, defer type noise cleanup
