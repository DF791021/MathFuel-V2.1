/**
 * Admin Panel
 * Operational control surface for MathFuel
 * Feature flags, maintenance mode, announcements, system controls
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

export function Admin() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"flags" | "maintenance" | "announcement">("flags");

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">Operational control surface for MathFuel</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab("flags")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "flags"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Feature Flags
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "maintenance"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Maintenance Mode
          </button>
          <button
            onClick={() => setActiveTab("announcement")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "announcement"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Announcements
          </button>
        </div>

        {/* Feature Flags Tab */}
        {activeTab === "flags" && <FeatureFlagsSection />}

        {/* Maintenance Mode Tab */}
        {activeTab === "maintenance" && <MaintenanceModeSection />}

        {/* Announcements Tab */}
        {activeTab === "announcement" && <AnnouncementSection />}
      </div>
    </div>
  );
}

/**
 * Feature Flags Section
 */
function FeatureFlagsSection() {
  const { data: flags, isLoading, refetch } = trpc.adminSettings.getAllFlags.useQuery();
  const toggleFlagMutation = trpc.adminSettings.toggleFlag.useMutation();

  const handleToggle = async (name: string, currentEnabled: boolean) => {
    try {
      await toggleFlagMutation.mutateAsync({
        name,
        enabled: !currentEnabled,
      });
      refetch();
    } catch (error) {
      console.error("Failed to toggle flag:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Toggle features on/off to control platform behavior and enable experimental features.
      </p>

      {flags?.map((flag) => (
        <Card key={flag.name}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">{flag.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{flag.description}</p>
                <p className="text-xs text-muted-foreground mt-2">Owner: {flag.owner}</p>
              </div>
              <Switch
                checked={flag.enabled}
                onCheckedChange={() => handleToggle(flag.name, flag.enabled)}
                disabled={toggleFlagMutation.isPending}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Maintenance Mode Section
 */
function MaintenanceModeSection() {
  const { data: status, isLoading, refetch } = trpc.adminSettings.getMaintenanceMode.useQuery();
  const enableMutation = trpc.adminSettings.enableMaintenance.useMutation();
  const disableMutation = trpc.adminSettings.disableMaintenance.useMutation();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status?.message) {
      setMessage(status.message);
    }
  }, [status]);

  const handleEnable = async () => {
    try {
      await enableMutation.mutateAsync({ message: message || "System is under maintenance" });
      refetch();
    } catch (error) {
      console.error("Failed to enable maintenance mode:", error);
    }
  };

  const handleDisable = async () => {
    try {
      await disableMutation.mutateAsync();
      refetch();
    } catch (error) {
      console.error("Failed to disable maintenance mode:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {status?.enabled && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Maintenance mode is currently ENABLED. All users will see a maintenance page.
          </AlertDescription>
        </Alert>
      )}

      {!status?.enabled && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Maintenance mode is currently DISABLED. Platform is operational.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode Message</CardTitle>
          <CardDescription>Message shown to users when maintenance mode is enabled</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter maintenance message..."
            className="min-h-24"
            disabled={status?.enabled}
          />

          <div className="flex gap-2">
            {!status?.enabled ? (
              <Button onClick={handleEnable} disabled={enableMutation.isPending || !message}>
                {enableMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Enable Maintenance Mode
              </Button>
            ) : (
              <Button onClick={handleDisable} variant="destructive" disabled={disableMutation.isPending}>
                {disableMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Disable Maintenance Mode
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Announcement Section
 */
function AnnouncementSection() {
  const { data: announcement, isLoading, refetch } = trpc.adminSettings.getAnnouncement.useQuery();
  const setMutation = trpc.adminSettings.setAnnouncement.useMutation();
  const [message, setMessage] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (announcement) {
      setMessage(announcement.message);
      setEnabled(announcement.enabled);
    }
  }, [announcement]);

  const handleSave = async () => {
    try {
      await setMutation.mutateAsync({ message, enabled });
      refetch();
    } catch (error) {
      console.error("Failed to save announcement:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {enabled && message && (
        <Alert className="border-blue-500 bg-blue-50">
          <AlertDescription className="text-blue-800">{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Announcement Banner</CardTitle>
          <CardDescription>Display a banner message to all users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter announcement message..."
              className="min-h-24"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={enabled} onCheckedChange={setEnabled} />
            <label className="text-sm font-medium">Show announcement banner</label>
          </div>

          <Button onClick={handleSave} disabled={setMutation.isPending}>
            {setMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Announcement
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
