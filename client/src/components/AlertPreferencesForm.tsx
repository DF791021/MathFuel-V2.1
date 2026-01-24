import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, Bell } from "lucide-react";
import { toast } from "sonner";

export function AlertPreferencesForm() {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("settings");

  // Fetch preferences
  const { data: preferences, isLoading, refetch } = trpc.alertPreferences.getPreferences.useQuery();
  const { data: alertHistory } = trpc.alertPreferences.getAlertHistory.useQuery({ limit: 20 });

  // Mutations
  const updateMutation = trpc.alertPreferences.updatePreferences.useMutation();
  const presetMutation = trpc.alertPreferences.applyPreset.useMutation();

  // Local state
  const [formData, setFormData] = useState({
    enableDeadlineAlerts: true,
    defaultReminderDays: 3,
    alertFrequency: "immediate" as "immediate" | "daily" | "weekly",
    preferredAlertTime: "09:00",
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        enableDeadlineAlerts: preferences.enableDeadlineAlerts ?? true,
        defaultReminderDays: preferences.defaultReminderDays ?? 3,
        alertFrequency: (preferences.alertFrequency ?? "immediate") as "immediate" | "daily" | "weekly",
        preferredAlertTime: preferences.preferredAlertTime ?? "09:00",
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync(formData);
      toast.success("Preferences saved successfully!");
      refetch();
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPreset = async (preset: "aggressive" | "moderate" | "minimal") => {
    try {
      await presetMutation.mutateAsync(preset);
      toast.success(`Applied ${preset} preset`);
      refetch();
    } catch (error) {
      toast.error("Failed to apply preset");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading preferences...</div>;
  }

  const presetDescriptions = {
    aggressive: "7 days before - Immediate notifications",
    moderate: "3 days before - Daily digest (recommended)",
    minimal: "1 day before - Weekly summary",
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* Quick Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Quick Presets
              </CardTitle>
              <CardDescription>Choose a preset to quickly configure your alert preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["aggressive", "moderate", "minimal"] as const).map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => handleApplyPreset(preset)}
                >
                  <div className="flex-1">
                    <div className="font-semibold capitalize">{preset} Reminders</div>
                    <div className="text-sm text-gray-600">{presetDescriptions[preset]}</div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Main Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Customize Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Enable/Disable Alerts */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enable-alerts" className="text-base font-semibold">
                    Enable Deadline Alerts
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">Receive email notifications for approaching goal deadlines</p>
                </div>
                <Switch
                  id="enable-alerts"
                  checked={formData.enableDeadlineAlerts}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableDeadlineAlerts: checked })
                  }
                />
              </div>

              {formData.enableDeadlineAlerts && (
                <>
                  {/* Reminder Days */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">
                      Remind me {formData.defaultReminderDays} day{formData.defaultReminderDays !== 1 ? "s" : ""} before deadline
                    </Label>
                    <Slider
                      value={[formData.defaultReminderDays]}
                      onValueChange={(value) =>
                        setFormData({ ...formData, defaultReminderDays: value[0] })
                      }
                      min={1}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>1 day</span>
                      <span>30 days</span>
                    </div>
                  </div>

                  {/* Alert Frequency */}
                  <div className="space-y-2">
                    <Label htmlFor="frequency" className="text-base font-semibold">
                      Alert Frequency
                    </Label>
                    <Select value={formData.alertFrequency} onValueChange={(value) =>
                      setFormData({ ...formData, alertFrequency: value as "immediate" | "daily" | "weekly" })
                    }>
                      <SelectTrigger id="frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">
                          <div>
                            <div className="font-semibold">Immediate</div>
                            <div className="text-xs text-gray-500">Get notified right away</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="daily">
                          <div>
                            <div className="font-semibold">Daily Digest</div>
                            <div className="text-xs text-gray-500">One email per day</div>
                          </div>
                        </SelectItem>
                        <SelectItem value="weekly">
                          <div>
                            <div className="font-semibold">Weekly Summary</div>
                            <div className="text-xs text-gray-500">One email per week</div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Preferred Alert Time */}
                  <div className="space-y-2">
                    <Label htmlFor="alert-time" className="text-base font-semibold">
                      Preferred Alert Time
                    </Label>
                    <input
                      id="alert-time"
                      type="time"
                      value={formData.preferredAlertTime}
                      onChange={(e) =>
                        setFormData({ ...formData, preferredAlertTime: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-sm text-gray-600">
                      Alerts will be sent around this time (timezone: your local time)
                    </p>
                  </div>
                </>
              )}

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={isSaving || updateMutation.isPending}
                className="w-full"
                size="lg"
              >
                {isSaving || updateMutation.isPending ? "Saving..." : "Save Preferences"}
              </Button>
            </CardContent>
          </Card>

          {/* Info Box */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">💡 Pro Tip</p>
                  <p>
                    Set your reminder to 3-7 days before your deadline to give yourself enough time to catch up. 
                    Adjust the alert frequency based on how many goals you have active.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Alert History
              </CardTitle>
              <CardDescription>Recent deadline alerts sent to you</CardDescription>
            </CardHeader>
            <CardContent>
              {!alertHistory || alertHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No alerts sent yet</p>
                  <p className="text-sm">Your alert history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertHistory.map((alert: any) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{alert.goalName}</p>
                        <p className="text-xs text-gray-600">
                          {alert.daysUntilDeadline} day{alert.daysUntilDeadline !== 1 ? "s" : ""} until deadline
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {alert.sentAt ? new Date(alert.sentAt).toLocaleString() : "Pending"}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        alert.status === "sent" ? "bg-green-100 text-green-700" :
                        alert.status === "dismissed" ? "bg-gray-100 text-gray-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {alert.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
