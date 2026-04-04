import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Trophy, Play, Target, ChartBar as BarChart3, BookOpen, LogOut,
  User, Map, Brain, Copy, Check, UserPlus, Settings, Gift, TrendingUp,
  Lightbulb, ChevronRight, CircleAlert as AlertCircle, Zap, Star, Rocket,
  Calendar, Award
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663117001051/BAbKuMSfjHaa9ao8qByqEp/mathfuel-logo-V7jjfN52dexxQobYgXDFCk.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── Streak Display ──────────────────────────────────────────────────────── */

function StreakDisplay({ streak, longest }: { streak: number; longest: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-200/60"
      style={{ background: "linear-gradient(135deg, oklch(0.98 0.02 70) 0%, oklch(0.96 0.04 60) 100%)" }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full translate-x-8 -translate-y-8 opacity-30"
        style={{ background: "radial-gradient(circle, oklch(0.72 0.18 55) 0%, transparent 70%)" }} />
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, oklch(0.70 0.22 50), oklch(0.60 0.22 25))" }}
            >
              <Flame className="w-7 h-7 text-white" />
            </div>
            {streak >= 3 && (
              <motion.div
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-[10px] font-black shadow-md"
              >
                !
              </motion.div>
            )}
          </div>
          <div>
            <p className="text-2xl font-extrabold leading-tight"
              style={{ color: "oklch(0.45 0.14 45)" }}
            >
              {streak} day{streak !== 1 ? "s" : ""}
            </p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: "oklch(0.55 0.12 50)" }}>
              Current Streak
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: "oklch(0.62 0.06 50)" }}>
              Best: {longest} days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Mastery Overview ────────────────────────────────────────────────────── */

function MasteryOverview({ mastery }: { mastery: any }) {
  const total = mastery.totalSkills || 1;
  const masteredPct = Math.round((mastery.mastered / total) * 100);
  const practicingPct = Math.round((mastery.practicing / total) * 100);

  return (
    <div className="rounded-2xl border border-border/50 bg-white p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.44 0.20 222 / 0.1)" }}
        >
          <Target className="w-4 h-4" style={{ color: "oklch(0.44 0.20 222)" }} />
        </div>
        <p className="font-extrabold text-foreground text-sm">Skill Mastery</p>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { value: mastery.mastered, label: "Mastered", bg: "oklch(0.52 0.16 163 / 0.1)", text: "oklch(0.32 0.12 163)" },
          { value: mastery.practicing, label: "Practicing", bg: "oklch(0.44 0.20 222 / 0.1)", text: "oklch(0.30 0.16 222)" },
          { value: `${mastery.overallAccuracy}%`, label: "Accuracy", bg: "oklch(0.72 0.18 75 / 0.1)", text: "oklch(0.45 0.14 65)" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: s.bg }}>
            <p className="text-xl font-extrabold" style={{ color: s.text }}>{s.value}</p>
            <p className="text-[10px] font-semibold mt-0.5" style={{ color: s.text }}>{s.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground font-medium">Overall Progress</span>
          <span className="font-extrabold text-foreground">{masteredPct}%</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full flex">
            <motion.div
              className="rounded-full"
              style={{ background: "oklch(0.52 0.16 163)" }}
              initial={{ width: 0 }}
              animate={{ width: `${masteredPct}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.div
              style={{ background: "oklch(0.44 0.20 222)" }}
              initial={{ width: 0 }}
              animate={{ width: `${practicingPct}%` }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
        <div className="flex gap-3 text-[10px] text-muted-foreground pt-0.5">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "oklch(0.52 0.16 163)" }} />
            Mastered
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "oklch(0.44 0.20 222)" }} />
            Practicing
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-muted" />
            Not started
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Badge Showcase ──────────────────────────────────────────────────────── */

function BadgeShowcase({ badges }: { badges: any[] }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.72 0.18 75 / 0.1)" }}
        >
          <Trophy className="w-4 h-4" style={{ color: "oklch(0.58 0.18 65)" }} />
        </div>
        <p className="font-extrabold text-foreground text-sm">
          Badges{badges.length > 0 && <span className="ml-1.5 text-xs font-bold text-muted-foreground">({badges.length})</span>}
        </p>
      </div>
      {badges.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-2">
            <Trophy className="w-6 h-6 opacity-30" />
          </div>
          <p className="text-xs">Complete sessions to earn badges!</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.id || i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.08, type: "spring", stiffness: 260, damping: 20 }}
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                style={{ background: "oklch(0.72 0.18 75 / 0.08)", borderColor: "oklch(0.72 0.18 75 / 0.2)", color: "oklch(0.50 0.16 60)" }}
              >
                <span>{badge.icon}</span>
                <span>{badge.title}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Recent Sessions ─────────────────────────────────────────────────────── */

function RecentSessions({ sessions }: { sessions: any[] }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.44 0.20 222 / 0.1)" }}
        >
          <BarChart3 className="w-4 h-4" style={{ color: "oklch(0.44 0.20 222)" }} />
        </div>
        <p className="font-extrabold text-foreground text-sm">Recent Sessions</p>
      </div>
      {sessions.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-2">
            <BookOpen className="w-6 h-6 opacity-30" />
          </div>
          <p className="text-xs">No sessions yet. Start practicing!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((session: any) => {
            const accuracy = session.totalProblems
              ? Math.round((session.correctAnswers / session.totalProblems) * 100)
              : 0;
            const isGreat = accuracy >= 80;
            const isOk = accuracy >= 60;
            return (
              <div key={session.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
                  style={{
                    background: isGreat
                      ? "linear-gradient(135deg, oklch(0.52 0.16 163), oklch(0.44 0.14 180))"
                      : isOk
                      ? "linear-gradient(135deg, oklch(0.72 0.18 75), oklch(0.65 0.18 55))"
                      : "linear-gradient(135deg, oklch(0.65 0.16 30), oklch(0.58 0.18 20))",
                  }}
                >
                  {accuracy}%
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{session.totalProblems} problems</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {session.correctAnswers}/{session.totalProblems} correct
                    {session.hintsUsed > 0 && ` · ${session.hintsUsed} hints`}
                  </p>
                </div>
                <div
                  className="text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                  style={session.status === "completed"
                    ? { background: "oklch(0.52 0.16 163 / 0.1)", color: "oklch(0.32 0.12 163)" }
                    : { background: "oklch(0.44 0.20 222 / 0.1)", color: "oklch(0.30 0.16 222)" }
                  }
                >
                  {session.status === "completed" ? "Done" : session.status}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Recommended Skills ──────────────────────────────────────────────────── */

function RecommendedSkills({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { data, isLoading } = trpc.student.getRecommendations.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const recommendations = data ?? [];

  const reasonConfig: Record<string, { bg: string; text: string; icon: string }> = {
    close:     { bg: "oklch(0.52 0.16 163 / 0.1)", text: "oklch(0.32 0.12 163)", icon: "⭐" },
    stale:     { bg: "oklch(0.72 0.18 75 / 0.1)",  text: "oklch(0.45 0.14 65)",  icon: "🔄" },
    struggling:{ bg: "oklch(0.44 0.20 222 / 0.1)", text: "oklch(0.30 0.16 222)", icon: "💪" },
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.52 0.16 163 / 0.1)" }}
        >
          <TrendingUp className="w-4 h-4" style={{ color: "oklch(0.42 0.14 163)" }} />
        </div>
        <p className="font-extrabold text-foreground text-sm">What to Work On Next</p>
        <div className="ml-auto">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full"
            style={{ background: "oklch(0.52 0.16 163 / 0.1)", color: "oklch(0.42 0.14 163)" }}
          >
            AI Powered
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-6 h-6 opacity-30" />
          </div>
          <p className="text-xs">Complete some sessions to get personalized recommendations!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recommendations.map((rec, i) => {
            const cfg = reasonConfig[rec.reasonType] ?? { bg: "oklch(0.94 0.01 220)", text: "oklch(0.50 0.04 222)", icon: "📚" };
            return (
              <motion.div
                key={rec.skillId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-background hover:bg-muted/30 transition-colors group"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: cfg.bg }}
                >
                  {cfg.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground truncate">{rec.skillName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{rec.reason}</p>
                </div>
                <Link href={`/practice/${rec.skillId}`} className="no-underline flex-shrink-0">
                  <Button size="sm" className="h-8 text-xs px-3 gap-1 rounded-lg group-hover:translate-x-0.5 transition-transform"
                    style={{ background: cfg.bg, color: cfg.text, border: "none" }}
                  >
                    Practice
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Error Patterns ──────────────────────────────────────────────────────── */

function ErrorPatterns({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { data, isLoading } = trpc.aiTutor.getErrorPatterns.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const patterns = data?.patterns ?? [];

  return (
    <div className="rounded-2xl border border-border/50 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "oklch(0.72 0.18 75 / 0.1)" }}
        >
          <Lightbulb className="w-4 h-4" style={{ color: "oklch(0.58 0.18 65)" }} />
        </div>
        <p className="font-extrabold text-foreground text-sm">Learning Insights</p>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          {[0, 1].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : patterns.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-2">
            <Lightbulb className="w-6 h-6 opacity-30" />
          </div>
          <p className="text-xs">Keep practicing and I'll spot any tricky patterns for you!</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {patterns.map((p, i) => (
            <motion.div
              key={p.skillId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-3 rounded-xl border space-y-2"
              style={{ background: "oklch(0.72 0.18 75 / 0.05)", borderColor: "oklch(0.72 0.18 75 / 0.2)" }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "oklch(0.58 0.18 65)" }} />
                  <p className="text-sm font-bold text-foreground truncate">{p.skillName}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "oklch(0.72 0.18 75 / 0.12)", color: "oklch(0.45 0.14 65)" }}
                >
                  {p.errorCount} mistake{p.errorCount !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.pattern}</p>
              <Link href={`/practice/${p.skillId}`} className="no-underline">
                <Button size="sm" className="h-7 text-xs px-2.5 gap-1 rounded-lg"
                  style={{ background: "oklch(0.72 0.18 75 / 0.12)", color: "oklch(0.45 0.14 65)", border: "none" }}
                >
                  Practice this skill
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Invite Code Card ────────────────────────────────────────────────────── */

function InviteCodeCard() {
  const [copied, setCopied] = useState(false);
  const generateCode = trpc.parent.generateInviteCode.useMutation();

  const handleGenerate = () => {
    generateCode.mutate(undefined, { onSuccess: () => setCopied(false) });
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ background: "linear-gradient(135deg, oklch(0.97 0.01 220), oklch(0.95 0.015 225))", borderColor: "oklch(0.44 0.20 222 / 0.15)" }}
    >
      <div className="p-5">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "oklch(0.44 0.20 222 / 0.12)" }}
          >
            <UserPlus className="w-5 h-5" style={{ color: "oklch(0.44 0.20 222)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-sm text-foreground">Connect a Parent</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Share this code with your parent so they can track your progress.
            </p>
            {generateCode.data ? (
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  <div className="bg-white rounded-xl px-4 py-2.5 font-mono text-2xl font-extrabold tracking-[0.2em] border"
                    style={{ color: "oklch(0.44 0.20 222)", borderColor: "oklch(0.44 0.20 222 / 0.2)" }}
                  >
                    {generateCode.data.code}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(generateCode.data!.code)}
                    className="h-10 w-10 p-0 flex-shrink-0 rounded-xl border"
                    style={{ borderColor: "oklch(0.44 0.20 222 / 0.25)" }}
                  >
                    <AnimatePresence mode="wait">
                      {copied
                        ? <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }}><Check className="w-4 h-4 text-emerald-600" /></motion.div>
                        : <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }}><Copy className="w-4 h-4" /></motion.div>
                      }
                    </AnimatePresence>
                  </Button>
                </div>
                <p className="text-[10px] mt-1.5" style={{ color: "oklch(0.55 0.08 222)" }}>
                  {generateCode.data.isExisting ? "Your existing code" : "New code generated"} — valid for 7 days
                </p>
              </div>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={generateCode.isPending}
                size="sm"
                className="mt-3 gap-1.5 rounded-xl"
                style={{ background: "oklch(0.44 0.20 222)", color: "white" }}
              >
                {generateCode.isPending ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Generate Invite Code
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function StudentDashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => { document.title = "Dashboard — MathFuel"; }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [authLoading, isAuthenticated]);

  const { data: dashboard, isLoading } = trpc.student.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  if (authLoading || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-52 w-full" style={{ background: "linear-gradient(135deg, oklch(0.36 0.20 240), oklch(0.44 0.20 222))" }} />
        <div className="max-w-4xl mx-auto px-4 -mt-20 space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <div className="grid sm:grid-cols-2 gap-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || "Learner";
  const streak = dashboard?.streak?.currentStreak ?? 0;
  const mastery = dashboard?.mastery ?? { totalSkills: 0, mastered: 0, practicing: 0, overallAccuracy: 0 };

  return (
    <div className="min-h-screen bg-background">

      {/* ── GRADIENT HERO HEADER ──────────────────────────────────────── */}
      <div className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.30 0.18 240) 0%, oklch(0.44 0.20 222) 50%, oklch(0.40 0.18 235) 100%)" }}
      >
        {/* Background decorations */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.18 75) 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute bottom-0 left-1/4 w-48 h-48 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, oklch(0.52 0.16 163) 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Top nav */}
        <nav className="relative max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <img src={LOGO_URL} alt="MathFuel" className="w-7 h-7" />
            <span className="font-extrabold text-white text-base" style={{ fontFamily: "'Chango', sans-serif" }}>
              Math<span style={{ color: "oklch(0.90 0.18 75)" }}>Fuel</span>
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {[
              { href: "/skills", icon: <Map className="w-4 h-4" />, label: "Skills" },
              { href: "/parent", icon: <User className="w-4 h-4" />, label: "Parent" },
              { href: "/leaderboard", icon: <Trophy className="w-4 h-4" />, label: "Ranks" },
              { href: "/referrals", icon: <Gift className="w-4 h-4" />, label: "Refer" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="no-underline">
                <Button variant="ghost" size="sm"
                  className="gap-1 px-2 sm:px-3 h-8 text-xs text-white/75 hover:text-white hover:bg-white/15 font-semibold transition-all"
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
            <Link href="/account" className="no-underline">
              <Button variant="ghost" size="sm" className="px-2 h-8 text-white/75 hover:text-white hover:bg-white/15 transition-all">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => logout()} className="px-2 h-8 text-white/75 hover:text-white hover:bg-white/15 transition-all">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative max-w-4xl mx-auto px-4 pt-4 pb-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-white/65 text-sm font-semibold mb-1">{getGreeting()}</p>
              <h1 className="!text-2xl sm:!text-3xl font-extrabold text-white !leading-tight">
                {firstName}! Ready to level up?
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {streak > 0 && (
                  <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full border border-white/20">
                    <Flame className="w-3.5 h-3.5 text-orange-300" />
                    <span className="text-xs font-bold text-white">{streak} day streak</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full border border-white/20">
                  <Star className="w-3.5 h-3.5 text-amber-300" />
                  <span className="text-xs font-bold text-white">{mastery.overallAccuracy}% accuracy</span>
                </div>
              </div>
            </div>

            <Link href="/practice" className="no-underline flex-shrink-0">
              <Button
                size="lg"
                className="gap-2 font-extrabold text-base px-6 h-12 rounded-2xl shadow-xl shadow-black/20 transition-all hover:shadow-2xl hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, oklch(0.90 0.18 75), oklch(0.78 0.18 60))", color: "oklch(0.20 0.06 65)" }}
              >
                <Rocket className="w-5 h-5" />
                Start Practice
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 -mt-8 pb-12 safe-bottom space-y-4">

        {/* Quick stats cards */}
        <motion.div
          variants={fadeUp} initial="hidden" animate="visible" custom={0}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            {
              value: mastery.mastered,
              label: "Skills Mastered",
              icon: <Award className="w-5 h-5" />,
              gradient: "linear-gradient(135deg, oklch(0.52 0.16 163), oklch(0.44 0.14 180))",
            },
            {
              value: mastery.practicing,
              label: "In Progress",
              icon: <Target className="w-5 h-5" />,
              gradient: "linear-gradient(135deg, oklch(0.44 0.20 222), oklch(0.36 0.18 240))",
            },
            {
              value: `${mastery.overallAccuracy}%`,
              label: "Overall Accuracy",
              icon: <TrendingUp className="w-5 h-5" />,
              gradient: "linear-gradient(135deg, oklch(0.72 0.18 75), oklch(0.65 0.18 60))",
            },
            {
              value: `${streak}d`,
              label: "Current Streak",
              icon: <Flame className="w-5 h-5" />,
              gradient: "linear-gradient(135deg, oklch(0.70 0.22 50), oklch(0.60 0.22 25))",
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border/50 p-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                style={{ background: stat.gradient }}
              >
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xl font-extrabold text-foreground leading-tight">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium leading-tight">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Streak + Mastery */}
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            <StreakDisplay
              streak={dashboard?.streak?.currentStreak ?? 0}
              longest={dashboard?.streak?.longestStreak ?? 0}
            />
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            <MasteryOverview mastery={mastery} />
          </motion.div>
        </div>

        {/* Recommendations */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <RecommendedSkills isAuthenticated={isAuthenticated} />
        </motion.div>

        {/* Badges + Sessions */}
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
            <BadgeShowcase badges={dashboard?.badges ?? []} />
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
            <RecentSessions sessions={dashboard?.recentSessions ?? []} />
          </motion.div>
        </div>

        {/* Insights */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}>
          <ErrorPatterns isAuthenticated={isAuthenticated} />
        </motion.div>

        {/* Invite code */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={7}>
          <InviteCodeCard />
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={8}>
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                href: "/practice",
                icon: <Brain className="w-5 h-5 sm:w-6 sm:h-6" />,
                label: "Practice",
                gradient: "linear-gradient(135deg, oklch(0.44 0.20 222), oklch(0.36 0.18 240))",
              },
              {
                href: "/skills",
                icon: <Map className="w-5 h-5 sm:w-6 sm:h-6" />,
                label: "Skill Map",
                gradient: "linear-gradient(135deg, oklch(0.52 0.16 163), oklch(0.44 0.14 180))",
              },
              {
                href: "/practice?type=review",
                icon: <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />,
                label: "Review",
                gradient: "linear-gradient(135deg, oklch(0.60 0.18 210), oklch(0.50 0.16 225))",
              },
              {
                href: "/parent",
                icon: <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />,
                label: "Progress",
                gradient: "linear-gradient(135deg, oklch(0.70 0.22 50), oklch(0.60 0.22 35))",
              },
            ].map(item => (
              <Link key={item.href} href={item.href} className="no-underline">
                <div className="bg-white rounded-2xl border border-border/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden">
                  <div className="p-3 sm:p-4 flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform"
                      style={{ background: item.gradient }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-foreground leading-tight">{item.label}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>

      </main>
    </div>
  );
}
