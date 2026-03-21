import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import {
  Trophy, Medal, Crown, Zap, Target, Flame,
  ArrowLeft, ChevronUp, Star, Sparkles, TrendingUp,
} from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663117001051/BAbKuMSfjHaa9ao8qByqEp/mathfuel-logo-V7jjfN52dexxQobYgXDFCk.webp";

type Period = "weekly" | "monthly" | "all_time";

const PERIOD_LABELS: Record<Period, string> = {
  weekly: "This Week",
  monthly: "This Month",
  all_time: "All Time",
};

const GRADE_OPTIONS = [
  { value: "all", label: "All Grades" },
  { value: "1", label: "Grade 1" },
  { value: "2", label: "Grade 2" },
  { value: "3", label: "Grade 3" },
  { value: "4", label: "Grade 4" },
  { value: "5", label: "Grade 5" },
];

// Podium colors
const PODIUM_COLORS = [
  "from-yellow-400 to-amber-500", // 1st - Gold
  "from-slate-300 to-slate-400",   // 2nd - Silver
  "from-orange-400 to-orange-600", // 3rd - Bronze
];

const PODIUM_ICONS = [Crown, Medal, Medal];
const PODIUM_HEIGHTS = ["h-32 sm:h-40", "h-24 sm:h-32", "h-20 sm:h-28"];
const PODIUM_ORDER = [1, 0, 2]; // Display: 2nd, 1st, 3rd

function formatXP(xp: number): string {
  if (xp >= 10000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toLocaleString();
}

/* ─── Podium Display ─── */
function PodiumCard({ rank, name, xp, accuracy, isCurrentUser }: {
  rank: number;
  name: string;
  xp: number;
  accuracy: number;
  isCurrentUser: boolean;
}) {
  const idx = rank - 1;
  const Icon = PODIUM_ICONS[idx];
  const podiumHeight = PODIUM_HEIGHTS[idx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + idx * 0.15, duration: 0.5, ease: "easeOut" }}
      className={`flex flex-col items-center ${rank === 1 ? "order-2 -mt-4" : rank === 2 ? "order-1" : "order-3"}`}
    >
      {/* Avatar circle */}
      <div className="relative mb-2">
        <div className={`w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-gradient-to-br ${PODIUM_COLORS[idx]} flex items-center justify-center shadow-lg ${isCurrentUser ? "ring-3 ring-primary ring-offset-2" : ""}`}>
          <Icon className={`w-6 h-6 sm:w-8 sm:h-8 text-white ${rank === 1 ? "drop-shadow-md" : ""}`} />
        </div>
        {rank === 1 && (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute -top-3 -right-1"
          >
            <Sparkles className="w-5 h-5 text-yellow-500" />
          </motion.div>
        )}
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-br ${PODIUM_COLORS[idx]} flex items-center justify-center text-white text-xs font-bold shadow`}>
          {rank}
        </div>
      </div>

      {/* Name */}
      <p className={`text-xs sm:text-sm font-semibold text-center leading-tight max-w-[90px] sm:max-w-[120px] truncate ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
        {isCurrentUser ? "You!" : name}
      </p>
      <p className="text-xs text-muted-foreground">{formatXP(xp)} XP</p>

      {/* Podium bar */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        transition={{ delay: 0.5 + idx * 0.1, duration: 0.4 }}
        className={`${podiumHeight} w-20 sm:w-28 mt-2 rounded-t-xl bg-gradient-to-t ${PODIUM_COLORS[idx]} flex items-end justify-center pb-2 shadow-inner`}
      >
        <span className="text-white/90 text-xs font-medium">{accuracy}%</span>
      </motion.div>
    </motion.div>
  );
}

/* ─── Ranking Row ─── */
function RankingRow({ rank, name, xp, accuracy, masteredSkills, streak, isCurrentUser, index }: {
  rank: number;
  name: string;
  xp: number;
  accuracy: number;
  masteredSkills: number;
  streak: number;
  isCurrentUser: boolean;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-colors ${
        isCurrentUser
          ? "bg-primary/10 border-2 border-primary/30 shadow-sm"
          : "hover:bg-muted/50"
      }`}
    >
      {/* Rank */}
      <div className="w-8 sm:w-10 text-center flex-shrink-0">
        {rank <= 3 ? (
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br ${PODIUM_COLORS[rank - 1]} flex items-center justify-center mx-auto`}>
            <span className="text-white text-xs sm:text-sm font-bold">{rank}</span>
          </div>
        ) : (
          <span className="text-sm sm:text-base font-semibold text-muted-foreground">{rank}</span>
        )}
      </div>

      {/* Name + badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`text-sm sm:text-base font-medium truncate ${isCurrentUser ? "text-primary font-semibold" : ""}`}>
            {isCurrentUser ? `${name} (You)` : name}
          </p>
          {isCurrentUser && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-0 flex-shrink-0">
              YOU
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span className="flex items-center gap-0.5">
            <Target className="w-3 h-3" />{accuracy}%
          </span>
          <span className="flex items-center gap-0.5">
            <Star className="w-3 h-3" />{masteredSkills}
          </span>
          {streak > 0 && (
            <span className="flex items-center gap-0.5">
              <Flame className="w-3 h-3 text-orange-500" />{streak}d
            </span>
          )}
        </div>
      </div>

      {/* XP */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm sm:text-base font-bold text-primary">{formatXP(xp)}</p>
        <p className="text-[10px] text-muted-foreground">XP</p>
      </div>
    </motion.div>
  );
}

/* ─── XP Breakdown Card ─── */
function XPBreakdown({ period }: { period: Period }) {
  const { data, isLoading } = trpc.leaderboard.getMyXPBreakdown.useQuery({ period });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const items = [
    { ...data.correctAnswers, icon: Target, color: "text-green-600" },
    { ...data.speedBonus, icon: Zap, color: "text-blue-500" },
    { ...data.masteryBonus, icon: Star, color: "text-purple-500" },
    { ...data.streakBonus, icon: Flame, color: "text-orange-500" },
  ];

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Your XP Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <item.icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold">{formatXP(item.xp)}</span>
              <span className="text-xs text-muted-foreground ml-1">XP</span>
            </div>
          </div>
        ))}
        <div className="border-t pt-2 flex items-center justify-between font-bold text-primary">
          <span>Total</span>
          <span>{formatXP(data.total)} XP</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── My Rank Card ─── */
function MyRankCard({ period }: { period: Period }) {
  const { data, isLoading } = trpc.leaderboard.getMyRank.useQuery({ period });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  if (data.message) {
    return (
      <Card className="border-dashed border-2 border-primary/30">
        <CardContent className="p-4 text-center">
          <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{data.message}</p>
          <Link href="/practice">
            <Button size="sm" className="mt-3 gap-1">
              <Zap className="w-4 h-4" /> Start Practicing
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <span className="text-xl font-bold text-white">#{data.rank}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{data.anonymousName}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Zap className="w-3 h-3 text-primary" />{formatXP(data.totalXP)} XP
              </span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />{data.accuracy}%
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" />{data.masteredSkills} skills
              </span>
            </div>
          </div>
          {data.rank && data.rank <= 10 && (
            <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 shadow">
              Top 10
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Leaderboard Page ─── */
export default function Leaderboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState<Period>("weekly");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  const gradeLevel = gradeFilter === "all" ? undefined : parseInt(gradeFilter);

  const { data, isLoading } = trpc.leaderboard.getRankings.useQuery({
    period,
    gradeLevel,
    limit: 50,
  });

  const rankings = data?.rankings ?? [];
  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between h-12 sm:h-14">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")} className="px-2 h-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Link href="/" className="flex items-center gap-1.5 font-bold text-base sm:text-lg no-underline">
              <img src={LOGO_URL} alt="MathFuel" className="w-6 h-6 sm:w-7 sm:h-7" />
              <span className="text-primary">Math</span>
              <span className="text-accent">Fuel</span>
            </Link>
          </div>
          <h1 className="text-sm sm:text-base font-semibold flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-500" />
            Leaderboard
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 safe-bottom">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period tabs */}
          <div className="flex bg-muted rounded-xl p-1 flex-1">
            {(["weekly", "monthly", "all_time"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 text-xs sm:text-sm font-medium py-2 px-3 rounded-lg transition-all ${
                  period === p
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {/* Grade filter */}
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-10">
              <SelectValue placeholder="All Grades" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* My Rank (if logged in) */}
        {isAuthenticated && (
          <div className="space-y-3">
            <MyRankCard period={period} />
            <XPBreakdown period={period} />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="space-y-4">
            <div className="flex justify-center gap-4 py-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="w-24 h-24 rounded-t-xl" />
                </div>
              ))}
            </div>
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && rankings.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="p-8 text-center">
              <Trophy className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-1">No rankings yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Be the first to earn XP and claim the top spot!
              </p>
              <Link href="/practice">
                <Button className="gap-2">
                  <Zap className="w-4 h-4" /> Start Practicing
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Podium (top 3) */}
        {!isLoading && top3.length > 0 && (
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-b from-primary/5 to-transparent pt-4 sm:pt-6 pb-0">
              <div className="flex justify-center items-end gap-2 sm:gap-4 px-4">
                {PODIUM_ORDER.map((orderIdx) => {
                  const entry = top3[orderIdx];
                  if (!entry) return <div key={orderIdx} className={`w-20 sm:w-28 ${orderIdx === 0 ? "order-2" : orderIdx === 1 ? "order-1" : "order-3"}`} />;
                  return (
                    <PodiumCard
                      key={entry.studentId}
                      rank={entry.rank}
                      name={entry.anonymousName}
                      xp={entry.totalXP}
                      accuracy={entry.accuracy}
                      isCurrentUser={!!user && entry.studentId === user.id}
                    />
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Rankings list (4th+) */}
        {!isLoading && rest.length > 0 && (
          <Card>
            <CardContent className="p-2 sm:p-3 divide-y divide-border/50">
              {rest.map((entry, idx) => (
                <RankingRow
                  key={entry.studentId}
                  rank={entry.rank}
                  name={entry.anonymousName}
                  xp={entry.totalXP}
                  accuracy={entry.accuracy}
                  masteredSkills={entry.masteredSkills}
                  streak={entry.currentStreak}
                  isCurrentUser={!!user && entry.studentId === user.id}
                  index={idx}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* XP Explainer */}
        <Card className="bg-muted/30">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              How XP Works
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Target className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Correct Answer</p>
                  <p className="text-muted-foreground">+10 XP each</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-3 h-3 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Speed Bonus</p>
                  <p className="text-muted-foreground">+2 XP under 15s</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Star className="w-3 h-3 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">Skill Mastery</p>
                  <p className="text-muted-foreground">+50 XP per skill</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Flame className="w-3 h-3 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium">Daily Streak</p>
                  <p className="text-muted-foreground">+5 XP per day</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA for non-authenticated */}
        {!isAuthenticated && (
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="font-bold text-lg mb-2">Ready to compete?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Sign up to track your rank and earn XP!
              </p>
              <Link href="/signup">
                <Button className="gap-2">
                  <ChevronUp className="w-4 h-4" /> Join the Leaderboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
