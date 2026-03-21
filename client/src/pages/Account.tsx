import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Crown, CreditCard, Settings, User, Mail,
  Calendar, Shield, Loader2, ExternalLink, Zap, CheckCircle2, Gift,
} from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663117001051/BAbKuMSfjHaa9ao8qByqEp/mathfuel-logo-V7jjfN52dexxQobYgXDFCk.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function Account() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const { data: subscription, isLoading: subLoading } = trpc.payment.getSubscription.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const createBillingPortal = trpc.payment.createBillingPortal.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, "_blank");
        toast.info("Opening Stripe billing portal...");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to open billing portal.");
    },
  });

  useEffect(() => {
    document.title = "Account - MathFuel";
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-amber-50/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const isPremium = subscription?.plan === "family";
  const periodEnd = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-amber-50/30">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <img src={LOGO_URL} alt="MathFuel" className="w-8 h-8" />
            <span
              className="text-xl font-extrabold text-foreground"
              style={{ fontFamily: "'Chango', sans-serif" }}
            >
              Math<span className="text-accent">Fuel</span>
            </span>
          </Link>
          <Link href="/dashboard" className="no-underline">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <h1 className="!text-2xl sm:!text-3xl font-extrabold text-foreground mb-1">
            Account Settings
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mb-8">
            Manage your profile and subscription
          </p>
        </motion.div>

        {/* Profile Card */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Profile</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium text-foreground">{user?.name || "Not set"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium text-foreground">{user?.email || "Not set"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium text-foreground capitalize">
                    {user?.userType || "student"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Subscription Card */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          <Card className={`mb-6 border-0 shadow-sm bg-white ${isPremium ? "ring-2 ring-accent/30" : ""}`}>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isPremium ? "bg-accent/15" : "bg-muted"
                }`}>
                  {isPremium ? (
                    <Crown className="w-5 h-5 text-accent" />
                  ) : (
                    <Zap className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Subscription</h2>
                  <p className="text-xs text-muted-foreground">
                    {isPremium ? "Family Plan" : "Free Plan"}
                  </p>
                </div>
                {isPremium && (
                  <div className="ml-auto">
                    <span className="bg-accent/15 text-accent text-xs font-bold px-2.5 py-1 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                )}
              </div>

              {subLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading subscription details...
                </div>
              ) : isPremium ? (
                <div className="space-y-4">
                  <div className="bg-accent/5 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <span className="font-medium text-foreground">
                        Unlimited practice sessions
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <span className="font-medium text-foreground">
                        Unlimited AI hints
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-accent" />
                      <span className="font-medium text-foreground">
                        Up to 4 student accounts
                      </span>
                    </div>
                  </div>

                  {periodEnd && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {subscription?.cancelAtPeriodEnd
                        ? `Cancels on ${periodEnd}`
                        : `Renews on ${periodEnd}`}
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => createBillingPortal.mutate({})}
                    disabled={createBillingPortal.isPending}
                  >
                    {createBillingPortal.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Manage Billing
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-50" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You're on the Free plan with limited daily sessions and AI hints.
                    Upgrade to Family for unlimited access.
                  </p>
                  <Link href="/pricing" className="no-underline block">
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Family
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Card */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
          <Card className="mb-6 border-0 shadow-sm bg-white">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Gift className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Refer a Friend</h2>
                  <p className="text-xs text-muted-foreground">
                    Earn a free month for each friend who subscribes
                  </p>
                </div>
              </div>
              <Link href="/referrals" className="no-underline block">
                <Button variant="outline" className="w-full gap-2">
                  <Gift className="w-4 h-4" />
                  View Referral Program
                  <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-50" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Actions Card */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center">
                  <Settings className="w-5 h-5 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Actions</h2>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Log Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
