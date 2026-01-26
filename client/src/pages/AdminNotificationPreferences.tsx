import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { Loader2, Bell, Mail, Eye, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AdminNotificationPreferences() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Fetch current preferences
  const { data: preferences, isLoading, refetch } = trpc.notificationPreferences.getPreferences.useQuery();

  // Mutations
  const updateMutation = trpc.notificationPreferences.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences updated successfully");
      refetch();
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(error.message);
      setIsSaving(false);
    },
  });

  const testMutation = trpc.notificationPreferences.sendTestNotification.useMutation({
    onSuccess: (data) => {
      const channels = [data.channels.email && "Email", data.channels.inApp && "In-App", data.channels.dashboard && "Dashboard"]
        .filter(Boolean)
        .join(", ");
      toast.success(`Test notification sent via: ${channels}`);
      setIsSendingTest(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
      setIsSendingTest(false);
    },
  });

  const handleUpdate = async (updates: any) => {
    setIsSaving(true);
    updateMutation.mutate(updates);
  };

  const handleSendTest = async () => {
    setIsSendingTest(true);
    testMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Failed to load preferences</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notification Preferences</h1>
          <p className="text-muted-foreground mt-2">
            Customize how and when you receive notifications about feedback, trials, and system events.
          </p>
        </div>

        {/* Notification Frequency */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Frequency
            </CardTitle>
            <CardDescription>
              Choose how often you want to receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {(["immediate", "daily", "weekly"] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => handleUpdate({ frequency: freq })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    preferences.frequency === freq
                      ? "border-green-600 bg-green-50 text-green-900"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="font-semibold capitalize">{freq}</div>
                  <div className="text-sm opacity-75">
                    {freq === "immediate" && "Get alerts right away"}
                    {freq === "daily" && "Once per day"}
                    {freq === "weekly" && "Once per week"}
                  </div>
                </button>
              ))}
            </div>

            {preferences.frequency !== "immediate" && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Digest Time</p>
                    <p className="text-sm text-blue-800">
                      {preferences.frequency === "daily" ? "Daily digest" : "Weekly digest"} will be sent at{" "}
                      <span className="font-mono font-bold">{preferences.digestTime || "09:00"}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Notification Channels
            </CardTitle>
            <CardDescription>
              Choose which channels to receive notifications through
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                { key: "emailEnabled", label: "Email", icon: Mail, description: "Receive notifications via email" },
                { key: "inAppEnabled", label: "In-App", icon: Eye, description: "See notifications in the app" },
                { key: "dashboardEnabled", label: "Dashboard", icon: Bell, description: "Show notifications on dashboard" },
              ].map(({ key, label, icon: Icon, description }) => (
                <button
                  key={key}
                  onClick={() => handleUpdate({ [key]: !preferences[key as keyof typeof preferences] })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                    preferences[key as keyof typeof preferences]
                      ? "border-green-600 bg-green-50"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">{label}</p>
                      <p className="text-sm opacity-75">{description}</p>
                    </div>
                  </div>
                  {preferences[key as keyof typeof preferences] && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notification Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Notification Types
            </CardTitle>
            <CardDescription>
              Choose which types of notifications you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  key: "feedbackEnabled",
                  label: "All Feedback",
                  description: "Receive all feedback submissions",
                  badge: "General",
                },
                {
                  key: "lowRatingsEnabled",
                  label: "Low Ratings (1-2 stars)",
                  description: "Get alerts for low satisfaction ratings",
                  badge: "High Priority",
                },
                {
                  key: "bugsEnabled",
                  label: "Bug Reports",
                  description: "Receive bug and issue reports",
                  badge: "Critical",
                },
                {
                  key: "trialEventsEnabled",
                  label: "Trial Events",
                  description: "Trial expirations and conversions",
                  badge: "Business",
                },
                {
                  key: "paymentEventsEnabled",
                  label: "Payment Events",
                  description: "Payment and subscription updates",
                  badge: "Financial",
                },
              ].map(({ key, label, description, badge }) => (
                <button
                  key={key}
                  onClick={() => handleUpdate({ [key]: !preferences[key as keyof typeof preferences] })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    preferences[key as keyof typeof preferences]
                      ? "border-green-600 bg-green-50"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{label}</p>
                      <p className="text-sm opacity-75">{description}</p>
                    </div>
                    <Badge variant={preferences[key as keyof typeof preferences] ? "default" : "outline"}>
                      {badge}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Quiet Hours</CardTitle>
            <CardDescription>
              Pause notifications during specific times (e.g., nights or weekends)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={() => handleUpdate({ quietHoursEnabled: !preferences.quietHoursEnabled })}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                preferences.quietHoursEnabled
                  ? "border-blue-600 bg-blue-50"
                  : "border-border hover:border-muted-foreground"
              }`}
            >
              <div>
                <p className="font-semibold">Enable Quiet Hours</p>
                <p className="text-sm opacity-75">Pause notifications during specified times</p>
              </div>
              {preferences.quietHoursEnabled && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
            </button>

            {preferences.quietHoursEnabled && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Quiet hours: {preferences.quietHoursStart || "22:00"} - {preferences.quietHoursEnd || "08:00"}
                </p>
                <p className="text-sm text-blue-800">
                  Notifications will be queued and delivered when quiet hours end
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Notification */}
        <Card>
          <CardHeader>
            <CardTitle>Test Your Settings</CardTitle>
            <CardDescription>
              Send yourself a test notification to verify everything is working
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleSendTest}
              disabled={isSendingTest}
              className="w-full"
              size="lg"
            >
              {isSendingTest ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending Test...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Send Test Notification
                </>
              )}
            </Button>
            {preferences.lastTestSentAt && (
              <p className="text-sm text-muted-foreground mt-3">
                Last test sent: {new Date(preferences.lastTestSentAt).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>
          <Button disabled={isSaving} size="lg">
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "All Changes Saved"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
