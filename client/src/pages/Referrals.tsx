import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Gift,
  Copy,
  Share2,
  Users,
  Trophy,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Rocket,
  ExternalLink,
  MessageCircle,
  Mail,
} from "lucide-react";

const LOGO_URL = import.meta.env.VITE_APP_LOGO || "";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    signed_up: {
      label: "Signed Up",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Clock className="w-3 h-3" />,
    },
    subscribed: {
      label: "Subscribed",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    rewarded: {
      label: "Rewarded",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <Trophy className="w-3 h-3" />,
    },
    expired: {
      label: "Expired",
      color: "bg-gray-50 text-gray-500 border-gray-200",
      icon: <Clock className="w-3 h-3" />,
    },
  };

  const c = config[status] || config.signed_up;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${c.color}`}>
      {c.icon}
      {c.label}
    </span>
  );
}

export default function Referrals() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);

  const dashboard = trpc.referral.getDashboard.useQuery(undefined, {
    enabled: !!user,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-teal-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const referralLink = dashboard.data?.code
    ? `${window.location.origin}/signup?ref=${dashboard.data.code}`
    : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent("Try MathFuel - Fun Math Practice for Kids!");
    const body = encodeURIComponent(
      `Hey! I've been using MathFuel to help my kids practice math, and it's been amazing. You should try it!\n\nSign up here: ${referralLink}\n\nWhen you subscribe, I'll get a free month as a thank you!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const handleShareSMS = () => {
    const text = encodeURIComponent(
      `Check out MathFuel for your kids' math practice! Sign up here: ${referralLink}`
    );
    window.open(`sms:?body=${text}`, "_blank");
  };

  const stats = [
    {
      label: "Friends Referred",
      value: dashboard.data?.totalReferrals || 0,
      icon: <Users className="w-5 h-5" />,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      label: "Free Months Earned",
      value: dashboard.data?.totalRewardMonths || 0,
      icon: <Trophy className="w-5 h-5" />,
      color: "text-amber-600 bg-amber-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              {LOGO_URL ? (
                <img src={LOGO_URL} alt="MathFuel" className="w-7 h-7 rounded-md" />
              ) : (
                <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="font-bold text-indigo-900">Referrals</span>
            </div>
          </div>
          <button
            onClick={() => navigate("/account")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Account
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/50 mb-4">
            <Gift className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-2">
            Give a Month, Get a Month
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Share MathFuel with friends. When they subscribe, you both win — they get a great math tool, and you get a <strong className="text-indigo-600">free month</strong> for each friend!
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3 sm:gap-4"
        >
          {stats.map((stat, i) => (
            <Card key={i} className="border-0 shadow-md">
              <CardContent className="p-4 sm:p-5 flex items-center gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Share Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="w-5 h-5" />
                Your Referral Link
              </CardTitle>
              <p className="text-indigo-100 text-sm mt-1">
                Share this link with friends and family
              </p>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              {/* Referral code display */}
              {dashboard.data?.code && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Your code</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 border-2 border-dashed border-indigo-200">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span className="text-lg font-mono font-bold text-indigo-700 tracking-wider">
                      {dashboard.data.code}
                    </span>
                  </div>
                </div>
              )}

              {/* Copy link */}
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={referralLink}
                  className="font-mono text-sm bg-gray-50"
                  onClick={handleCopy}
                />
                <Button
                  onClick={handleCopy}
                  variant={copied ? "default" : "outline"}
                  className={`shrink-0 gap-2 transition-all ${
                    copied ? "bg-emerald-600 hover:bg-emerald-700" : ""
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleShareEmail}
                  className="gap-2 h-11"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareSMS}
                  className="gap-2 h-11"
                >
                  <MessageCircle className="w-4 h-4" />
                  Text Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Share your link",
                    desc: "Send your unique referral link to friends and family",
                    color: "bg-indigo-100 text-indigo-700",
                  },
                  {
                    step: "2",
                    title: "Friend signs up",
                    desc: "They create an account using your referral link",
                    color: "bg-teal-100 text-teal-700",
                  },
                  {
                    step: "3",
                    title: "Friend subscribes",
                    desc: "When they subscribe to the Family Plan, your reward is triggered",
                    color: "bg-amber-100 text-amber-700",
                  },
                  {
                    step: "4",
                    title: "You get a free month!",
                    desc: "A 100% discount is automatically applied to your next billing cycle",
                    color: "bg-emerald-100 text-emerald-700",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${item.color}`}
                    >
                      {item.step}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{item.title}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral History */}
        {dashboard.data?.referrals && dashboard.data.referrals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Your Referrals
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="space-y-3">
                  {dashboard.data.referrals.map((ref) => (
                    <div
                      key={ref.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-indigo-600">
                            {ref.refereeName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {ref.refereeName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(ref.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={ref.status} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Empty state */}
        {dashboard.data?.referrals && dashboard.data.referrals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="border-0 shadow-md">
              <CardContent className="p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-gray-400" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">No referrals yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Share your referral link with friends and family to start earning free months!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
