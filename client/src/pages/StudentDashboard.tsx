import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame, Star, Trophy, Zap, Play, Target, BarChart3,
  ChevronRight, BookOpen, LogOut, User, Map, Brain, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

function StreakDisplay({ streak, longest }: { streak: number; longest: number }) {
  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
              <Flame className="w-8 h-8 text-white" />
            </div>
            {streak >= 3 && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold shadow"
              >
                🔥
              </motion.div>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-orange-700">{streak} day{streak !== 1 ? "s" : ""}</p>
            <p className="text-sm text-orange-600/80">Current Streak</p>
            <p className="text-xs text-muted-foreground mt-1">Best: {longest} days</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MasteryOverview({ mastery }: { mastery: any }) {
  const total = mastery.totalSkills || 1;
  const masteredPct = Math.round((mastery.mastered / total) * 100);
  const practicingPct = Math.round((mastery.practicing / total) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Skill Mastery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3 rounded-xl bg-green-50 border border-green-200">
            <p className="text-2xl font-bold text-green-700">{mastery.mastered}</p>
            <p className="text-xs text-green-600">Mastered</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-2xl font-bold text-blue-700">{mastery.practicing}</p>
            <p className="text-xs text-blue-600">Practicing</p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
            <p className="text-2xl font-bold text-purple-700">{mastery.overallAccuracy}%</p>
            <p className="text-xs text-purple-600">Accuracy</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{masteredPct}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full flex">
              <div className="bg-green-500 transition-all duration-500" style={{ width: `${masteredPct}%` }} />
              <div className="bg-blue-400 transition-all duration-500" style={{ width: `${practicingPct}%` }} />
            </div>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Mastered</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" /> Practicing</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-muted" /> Not Started</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BadgeShowcase({ badges }: { badges: any[] }) {
  if (badges.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Complete practice sessions to earn badges!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Badges ({badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.id || i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
            >
              <Badge variant="secondary" className="py-2 px-3 text-sm gap-1.5">
                <span>{badge.icon}</span>
                <span>{badge.title}</span>
              </Badge>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentSessions({ sessions }: { sessions: any[] }) {
  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No sessions yet. Start practicing!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          Recent Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.map((session: any) => {
          const accuracy = session.totalProblems
            ? Math.round((session.correctAnswers / session.totalProblems) * 100)
            : 0;
          return (
            <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  accuracy >= 80 ? "bg-green-500" : accuracy >= 60 ? "bg-yellow-500" : "bg-orange-500"
                }`}>
                  {accuracy}%
                </div>
                <div>
                  <p className="text-sm font-medium">{session.totalProblems} problems</p>
                  <p className="text-xs text-muted-foreground">
                    {session.correctAnswers}/{session.totalProblems} correct
                    {session.hintsUsed > 0 && ` · ${session.hintsUsed} hints`}
                  </p>
                </div>
              </div>
              <Badge variant={session.status === "completed" ? "default" : "secondary"} className="text-xs">
                {session.status === "completed" ? "Done" : session.status}
              </Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function StudentDashboard() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = "Dashboard - MathFuel";
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const { data: dashboard, isLoading } = trpc.student.getDashboard.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  if (authLoading || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663117001051/BAbKuMSfjHaa9ao8qByqEp/mathfuel-logo-V7jjfN52dexxQobYgXDFCk.webp"
              alt="MathFuel"
              className="w-8 h-8"
            />
            <span className="text-primary">Math</span>
            <span className="text-accent">Fuel</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/skills">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Map className="w-4 h-4" /> Skills
              </Button>
            </Link>
            <Link href="/parent">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <User className="w-4 h-4" /> Parent
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-1.5 text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Welcome + Quick Start */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Hey {user?.name?.split(" ")[0] || "Learner"}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">Ready to practice some math today?</p>
            </div>
            <Link href="/practice">
              <Button size="lg" className="gap-2 shadow-lg text-lg px-8">
                <Play className="w-5 h-5" />
                Start Practice
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
            <StreakDisplay
              streak={dashboard?.streak?.currentStreak ?? 0}
              longest={dashboard?.streak?.longestStreak ?? 0}
            />
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            <MasteryOverview mastery={dashboard?.mastery ?? { totalSkills: 0, mastered: 0, practicing: 0, overallAccuracy: 0 }} />
          </motion.div>
        </div>

        {/* Badges + Sessions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            <BadgeShowcase badges={dashboard?.badges ?? []} />
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
            <RecentSessions sessions={dashboard?.recentSessions ?? []} />
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/practice", icon: Brain, label: "Daily Practice", color: "bg-primary/10 text-primary" },
              { href: "/skills", icon: Map, label: "Skill Map", color: "bg-green-100 text-green-700" },
              { href: "/practice?type=review", icon: BookOpen, label: "Review", color: "bg-purple-100 text-purple-700" },
              { href: "/parent", icon: BarChart3, label: "Progress", color: "bg-orange-100 text-orange-700" },
            ].map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
