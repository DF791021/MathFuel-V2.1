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
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import {
  ArrowLeft, Users, BarChart3, Flame, Target, Trophy,
  Clock, BookOpen, ChevronRight, Plus, Sparkles,
  CheckCircle2, XCircle, TrendingUp, Calendar,
} from "lucide-react";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

export default function ParentDashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  useEffect(() => {
    document.title = "Parent Dashboard - MathFuel";
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const { data: children, isLoading: childrenLoading } = trpc.parent.getChildren.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  const { data: childProgress, isLoading: progressLoading } = trpc.parent.getChildProgress.useQuery(
    { childId: selectedChildId! },
    { enabled: !!selectedChildId, refetchOnWindowFocus: false }
  );

  // Auto-select first child
  useEffect(() => {
    if (children?.length && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Parent Dashboard
            </h1>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {childrenLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
          </div>
        ) : !children || children.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Child Selector */}
            {children.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {children.map((child: any) => (
                  <Button
                    key={child.id}
                    variant={selectedChildId === child.id ? "default" : "outline"}
                    onClick={() => setSelectedChildId(child.id)}
                    className="gap-2 flex-shrink-0"
                  >
                    <Users className="w-4 h-4" />
                    {child.name}
                  </Button>
                ))}
              </div>
            )}

            {/* Selected Child Overview */}
            {selectedChildId && (
              <ChildOverview
                child={children.find((c: any) => c.id === selectedChildId)}
                progress={childProgress}
                isLoading={progressLoading}
              />
            )}
          </>
        )}

        {/* Self-view: if user has their own data, show it */}
        {(!children || children.length === 0) && (
          <SelfProgressView />
        )}
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
      <h2 className="text-2xl font-bold mb-2">No Linked Students</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        As a parent, you can view your child's progress here. Link a student account to get started, or view your own progress below.
      </p>
      <SelfProgressView />
    </div>
  );
}

function SelfProgressView() {
  const { data: dashboard, isLoading } = trpc.student.getDashboard.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <Skeleton className="h-64" />;
  if (!dashboard) return null;

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0} className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Your Progress
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label="Streak"
          value={`${dashboard.streak?.currentStreak ?? 0} days`}
          color="bg-orange-50 border-orange-200"
        />
        <StatCard
          icon={<Target className="w-5 h-5 text-green-500" />}
          label="Mastered"
          value={`${dashboard.mastery?.mastered ?? 0} skills`}
          color="bg-green-50 border-green-200"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          label="Accuracy"
          value={`${dashboard.mastery?.overallAccuracy ?? 0}%`}
          color="bg-blue-50 border-blue-200"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5 text-yellow-500" />}
          label="Badges"
          value={`${dashboard.badges?.length ?? 0}`}
          color="bg-yellow-50 border-yellow-200"
        />
      </div>

      {/* Recent Sessions */}
      {dashboard.recentSessions?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.recentSessions.map((session: any) => {
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
      )}

      {/* Skill Mastery */}
      {dashboard.mastery?.skills?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Skill Mastery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dashboard.mastery.skills.map((skill: any) => (
              <div key={skill.skillId} className="flex items-center gap-3 p-2 rounded-lg">
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  skill.masteryLevel === "mastered" ? "bg-green-500" :
                  skill.masteryLevel === "close" ? "bg-blue-500" :
                  skill.masteryLevel === "practicing" ? "bg-yellow-500" : "bg-muted"
                }`} />
                <span className="text-sm flex-1">Skill #{skill.skillId}</span>
                <Progress value={skill.masteryScore} className="w-20 h-2" />
                <span className="text-xs text-muted-foreground w-10 text-right">{skill.masteryScore}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function ChildOverview({ child, progress, isLoading }: {
  child: any;
  progress: any;
  isLoading: boolean;
}) {
  if (!child) return null;

  return (
    <div className="space-y-6">
      {/* Child Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{child.name}</h2>
                <p className="text-muted-foreground">Grade {child.gradeLevel || "1"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                <p className="text-3xl font-bold text-primary">{child.overallAccuracy}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Row */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            label="Streak"
            value={`${child.streak} days`}
            color="bg-orange-50 border-orange-200"
          />
          <StatCard
            icon={<Target className="w-5 h-5 text-green-500" />}
            label="Mastered"
            value={`${child.skillsMastered}/${child.totalSkills}`}
            color="bg-green-50 border-green-200"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-blue-500" />}
            label="Active Days"
            value={`${child.totalActiveDays}`}
            color="bg-blue-50 border-blue-200"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-yellow-500" />}
            label="Best Streak"
            value={`${child.longestStreak} days`}
            color="bg-yellow-50 border-yellow-200"
          />
        </div>
      </motion.div>

      {/* Detailed Progress */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : progress ? (
        <>
          {/* Mastery Details */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Skill Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-80 overflow-y-auto">
                {progress.mastery?.length > 0 ? (
                  progress.mastery.map((m: any) => (
                    <div key={m.skillId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        m.masteryLevel === "mastered" ? "bg-green-500" :
                        m.masteryLevel === "close" ? "bg-blue-500" :
                        m.masteryLevel === "practicing" ? "bg-yellow-500" : "bg-muted"
                      }`} />
                      <span className="text-sm flex-1">Skill #{m.skillId}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={m.masteryScore} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground w-10 text-right">{m.masteryScore}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">No skills practiced yet.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Sessions */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {progress.sessions?.length > 0 ? (
                  progress.sessions.map((session: any) => {
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
                        <div className="text-right">
                          <Badge variant={session.status === "completed" ? "default" : "secondary"} className="text-xs">
                            {session.status === "completed" ? "Done" : session.status}
                          </Badge>
                          {session.completedAt && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(session.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-4">No sessions yet.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Badges */}
          {progress.badges?.length > 0 && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Badges Earned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {progress.badges.map((badge: any, i: number) => (
                      <Badge key={badge.id || i} variant="secondary" className="py-2 px-3 text-sm gap-1.5">
                        <span>{badge.icon}</span>
                        <span>{badge.title}</span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </>
      ) : null}
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <Card className={`${color}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
