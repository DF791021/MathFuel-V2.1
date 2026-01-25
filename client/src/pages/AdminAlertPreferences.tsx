import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Mail, AlertCircle, Zap } from "lucide-react";

export function AdminAlertPreferences() {
  const [preferences, setPreferences] = useState({
    notificationFrequency: "immediate",
    alertTypes: {
      allFeedback: true,
      lowRatings: true,
      bugReports: true,
      featureRequests: false,
    },
    channels: {
      email: true,
      inApp: true,
      dashboard: true,
    },
    lowRatingThreshold: 2,
    digestTime: "09:00",
  });

  const [saved, setSaved] = useState(false);

  const handleFrequencyChange = (value: string) => {
    setPreferences((prev) => ({ ...prev, notificationFrequency: value }));
    setSaved(false);
  };

  const handleAlertTypeChange = (type: keyof typeof preferences.alertTypes) => {
    setPreferences((prev) => ({
      ...prev,
      alertTypes: {
        ...prev.alertTypes,
        [type]: !prev.alertTypes[type],
      },
    }));
    setSaved(false);
  };

  const handleChannelChange = (channel: keyof typeof preferences.channels) => {
    setPreferences((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel],
      },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    console.log("Preferences saved:", preferences);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="text-gray-600 mt-2">Customize how you receive feedback alerts and notifications</p>
      </div>

      {/* Notification Frequency */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notification Frequency
          </CardTitle>
          <CardDescription>How often do you want to receive notifications?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              {
                value: "immediate",
                label: "Immediate",
                description: "Get notified instantly when feedback arrives",
              },
              {
                value: "daily",
                label: "Daily Digest",
                description: "Receive a summary once per day at a scheduled time",
              },
              {
                value: "weekly",
                label: "Weekly Summary",
                description: "Get a comprehensive report once per week",
              },
              {
                value: "manual",
                label: "Manual Only",
                description: "Check the dashboard when you want",
              },
            ].map((option) => (
              <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="frequency"
                  value={option.value}
                  checked={preferences.notificationFrequency === option.value}
                  onChange={(e) => handleFrequencyChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <p className="font-medium text-gray-900">{option.label}</p>
                  <p className="text-sm text-gray-600">{option.description}</p>
                </div>
              </label>
            ))}
          </div>

          {preferences.notificationFrequency === "daily" && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Digest Time</label>
              <input
                type="time"
                value={preferences.digestTime}
                onChange={(e) => setPreferences((prev) => ({ ...prev, digestTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            Alert Types
          </CardTitle>
          <CardDescription>Choose which types of feedback trigger notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              {
                key: "allFeedback",
                label: "All Feedback",
                description: "Receive alerts for all feedback submissions",
              },
              {
                key: "lowRatings",
                label: "Low Ratings (1-2 stars)",
                description: "High-priority alerts for dissatisfied users",
              },
              {
                key: "bugReports",
                label: "Bug Reports",
                description: "Immediate alerts for reported issues",
              },
              {
                key: "featureRequests",
                label: "Feature Requests",
                description: "Notifications for feature suggestions",
              },
            ].map((alert) => (
              <div key={alert.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{alert.label}</p>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                </div>
                <Switch
                  checked={preferences.alertTypes[alert.key as keyof typeof preferences.alertTypes]}
                  onCheckedChange={() => handleAlertTypeChange(alert.key as keyof typeof preferences.alertTypes)}
                />
              </div>
            ))}
          </div>

          {preferences.alertTypes.lowRatings && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">Low Rating Threshold</label>
              <select
                value={preferences.lowRatingThreshold}
                onChange={(e) => setPreferences((prev) => ({ ...prev, lowRatingThreshold: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={1}>1 star only</option>
                <option value={2}>1-2 stars</option>
                <option value={3}>1-3 stars</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-green-600" />
            Notification Channels
          </CardTitle>
          <CardDescription>Where should we send notifications?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              key: "email",
              label: "Email",
              description: "Send notifications to your email address",
            },
            {
              key: "inApp",
              label: "In-App Notifications",
              description: "Show notifications in the dashboard",
            },
            {
              key: "dashboard",
              label: "Dashboard Banner",
              description: "Display alerts on the feedback dashboard",
            },
          ].map((channel) => (
            <div key={channel.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">{channel.label}</p>
                <p className="text-sm text-gray-600">{channel.description}</p>
              </div>
              <Switch
                checked={preferences.channels[channel.key as keyof typeof preferences.channels]}
                onCheckedChange={() => handleChannelChange(channel.key as keyof typeof preferences.channels)}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            Your Alert Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Frequency:</strong> {preferences.notificationFrequency === "immediate" ? "Instant notifications" : preferences.notificationFrequency === "daily" ? `Daily digest at ${preferences.digestTime}` : preferences.notificationFrequency === "weekly" ? "Weekly summary" : "Manual only"}
            </p>
            <p>
              <strong>Alert Types:</strong>{" "}
              {Object.entries(preferences.alertTypes)
                .filter(([, enabled]) => enabled)
                .map(([type]) => type)
                .join(", ") || "None selected"}
            </p>
            <p>
              <strong>Channels:</strong>{" "}
              {Object.entries(preferences.channels)
                .filter(([, enabled]) => enabled)
                .map(([channel]) => channel)
                .join(", ") || "None selected"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-3">
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          Save Preferences
        </Button>
        {saved && <div className="flex items-center text-green-600 text-sm font-medium">✓ Preferences saved successfully</div>}
      </div>
    </div>
  );
}
