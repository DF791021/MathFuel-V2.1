import { useEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Rocket, Crown, CheckCircle2, ArrowRight,
  Sparkles, Users, Brain, BarChart3, Shield,
} from "lucide-react";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663117001051/BAbKuMSfjHaa9ao8qByqEp/mathfuel-logo-V7jjfN52dexxQobYgXDFCk.webp";

/* ─── Confetti Burst ─── */

function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const colors = ["#f59e0b", "#6366f1", "#22c55e", "#ef4444", "#3b82f6", "#ec4899"];

  // Initial big burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors,
  });

  // Continuous side cannons
  const frame = () => {
    if (Date.now() > end) return;

    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors,
    });

    requestAnimationFrame(frame);
  };
  frame();

  // Final shower
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { y: 0.35 },
      colors,
      gravity: 0.8,
    });
  }, 1500);
}

/* ─── Animated Check Mark ─── */

function AnimatedCheckMark() {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}
      className="relative mx-auto"
    >
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-xl shadow-green-200/50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
        >
          <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 text-white" strokeWidth={2.5} />
        </motion.div>
      </div>
      {/* Glow ring */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1.3, opacity: 0 }}
        transition={{ delay: 0.5, duration: 1.2, repeat: 2, ease: "easeOut" }}
        className="absolute inset-0 rounded-full border-4 border-green-400/40"
      />
    </motion.div>
  );
}

/* ─── Feature Pill ─── */

function FeaturePill({
  icon: Icon,
  label,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 shadow-sm border border-border/40"
    >
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </motion.div>
  );
}

/* ─── Main Page ─── */

export default function PaymentSuccess() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const confettiFired = useRef(false);
  const [showContent, setShowContent] = useState(false);

  // Invalidate subscription cache so Account page reflects the new plan
  const utils = trpc.useUtils();

  const fireOnce = useCallback(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;
    fireConfetti();
    // Stagger content reveal after confetti starts
    setTimeout(() => setShowContent(true), 200);
  }, []);

  useEffect(() => {
    document.title = "Welcome to MathFuel Family!";
    fireOnce();
    // Refresh subscription data in the background
    utils.payment.getSubscription.invalidate();
    utils.payment.hasPremium.invalidate();
  }, [fireOnce, utils]);

  // Redirect unauthenticated users after a brief pause
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const t = setTimeout(() => navigate("/login"), 2000);
      return () => clearTimeout(t);
    }
  }, [loading, isAuthenticated, navigate]);

  const userName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-amber-50/30 overflow-hidden">
      {/* Nav */}
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
              Dashboard
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-lg mx-auto px-4 pt-10 sm:pt-16 pb-12 text-center">
        <AnimatedCheckMark />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mt-8"
        >
          <div className="inline-flex items-center gap-1.5 bg-accent/10 text-accent text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Crown className="w-3.5 h-3.5" />
            FAMILY PLAN ACTIVE
          </div>

          <h1 className="!text-3xl sm:!text-4xl font-extrabold text-foreground leading-tight">
            You're all set, {userName}!
          </h1>

          <p className="text-muted-foreground mt-3 text-base sm:text-lg max-w-md mx-auto leading-relaxed">
            Your MathFuel Family subscription is now active.
            Unlimited practice and AI-powered learning await.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={showContent ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-8"
        >
          <Link href="/practice" className="no-underline">
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90 text-base px-8 py-6 rounded-xl shadow-lg shadow-accent/20 gap-2 w-full sm:w-auto"
            >
              <Rocket className="w-5 h-5" />
              Start Practicing Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <p className="text-xs text-muted-foreground mt-3">
            Or{" "}
            <Link href="/account" className="underline hover:text-foreground transition-colors">
              view your account
            </Link>{" "}
            to manage your subscription.
          </p>
        </motion.div>

        {/* Unlocked Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-10"
        >
          <Card className="border-0 shadow-md bg-white/80 backdrop-blur-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-center gap-2 mb-5">
                <Sparkles className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  What you've unlocked
                </h2>
              </div>

              <div className="grid gap-3">
                <FeaturePill
                  icon={Rocket}
                  label="Unlimited practice sessions — no daily cap"
                  delay={0.6}
                />
                <FeaturePill
                  icon={Brain}
                  label="Unlimited AI hints & step-by-step explanations"
                  delay={0.7}
                />
                <FeaturePill
                  icon={BarChart3}
                  label="Detailed mastery reports & analytics"
                  delay={0.8}
                />
                <FeaturePill
                  icon={Users}
                  label="Up to 4 student accounts on one plan"
                  delay={0.9}
                />
                <FeaturePill
                  icon={Shield}
                  label="Priority support & early access to new features"
                  delay={1.0}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Receipt note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={showContent ? { opacity: 1 } : {}}
          transition={{ delay: 1.2, duration: 0.4 }}
          className="text-xs text-muted-foreground mt-6"
        >
          A receipt has been sent to your email. You can manage billing anytime from your{" "}
          <Link href="/account" className="underline hover:text-foreground transition-colors">
            Account Settings
          </Link>
          .
        </motion.p>
      </div>
    </div>
  );
}
