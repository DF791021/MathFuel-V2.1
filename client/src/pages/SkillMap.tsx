import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  ArrowLeft, ChevronRight, Lock, CheckCircle2, Circle,
  Sparkles, Play, Star, Map as MapIcon,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

function getMasteryColor(level: string | undefined) {
  switch (level) {
    case "mastered": return "bg-green-500";
    case "close": return "bg-blue-500";
    case "practicing": return "bg-yellow-500";
    default: return "bg-muted";
  }
}

function getMasteryBadge(level: string | undefined) {
  switch (level) {
    case "mastered": return <Badge className="bg-green-100 text-green-700 border-green-200">Mastered ✓</Badge>;
    case "close": return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Almost There</Badge>;
    case "practicing": return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Practicing</Badge>;
    default: return <Badge variant="secondary">Not Started</Badge>;
  }
}

export default function SkillMap() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedGrade, setSelectedGrade] = useState(1);

  useEffect(() => {
    document.title = "Skill Map - MathFuel";
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  // Set grade from user profile
  useEffect(() => {
    if (user?.gradeLevel) setSelectedGrade(user.gradeLevel);
  }, [user?.gradeLevel]);

  const { data: domains, isLoading: domainsLoading } = trpc.mathContent.getDomains.useQuery(
    { gradeLevel: selectedGrade },
    { enabled: isAuthenticated }
  );

  const { data: mastery } = trpc.student.getMastery.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchOnWindowFocus: false,
  });

  // Build mastery map for quick lookup
  const masteryMap = useMemo(() => {
    const map = new Map<number, any>();
    if (mastery) {
      for (const m of mastery) {
        map.set(m.skillId, m);
      }
    }
    return map;
  }, [mastery]);

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
              <MapIcon className="w-5 h-5 text-primary" />
              Skill Map
            </h1>
          </div>
          <div className="flex gap-2">
            {[1, 2].map((grade) => (
              <Button
                key={grade}
                variant={selectedGrade === grade ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGrade(grade)}
              >
                Grade {grade}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {domainsLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : (
          domains?.map((domain: any, domainIndex: number) => (
            <DomainSection
              key={domain.id}
              domain={domain}
              index={domainIndex}
              masteryMap={masteryMap}
              gradeLevel={selectedGrade}
            />
          ))
        )}

        {!domainsLoading && (!domains || domains.length === 0) && (
          <div className="text-center py-16 text-muted-foreground">
            <MapIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No skills available for Grade {selectedGrade} yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function DomainSection({ domain, index, masteryMap, gradeLevel }: {
  domain: any;
  index: number;
  masteryMap: Map<number, any>;
  gradeLevel: number;
}) {
  const { data: skills, isLoading } = trpc.mathContent.getSkillsByDomain.useQuery(
    { domainId: domain.id },
    { refetchOnWindowFocus: false }
  );

  const domainMastery = useMemo(() => {
    if (!skills) return { mastered: 0, total: 0, pct: 0 };
    const mastered = skills.filter((s: any) => masteryMap.get(s.id)?.masteryLevel === "mastered").length;
    return { mastered, total: skills.length, pct: skills.length > 0 ? Math.round((mastered / skills.length) * 100) : 0 };
  }, [skills, masteryMap]);

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={index}>
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{domain.icon}</span>
              <div>
                <CardTitle className="text-xl">{domain.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">{domain.description}</p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{domainMastery.mastered}/{domainMastery.total} mastered</p>
              <Progress value={domainMastery.pct} className="w-24 h-2 mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {skills?.map((skill: any, skillIndex: number) => {
                const m = masteryMap.get(skill.id);
                return (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    mastery={m}
                    index={skillIndex}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SkillCard({ skill, mastery, index }: { skill: any; mastery: any; index: number }) {
  const [, navigate] = useLocation();
  const score = mastery?.masteryScore ?? 0;
  const level = mastery?.masteryLevel ?? "not_started";

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div
        onClick={() => navigate(`/practice/${skill.id}`)}
        className="flex items-center gap-3 p-3 rounded-xl border hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group"
      >
        {/* Mastery indicator */}
        <div className="relative flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getMasteryColor(level)}`}>
            {level === "mastered" ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : level === "not_started" ? (
              <Circle className="w-5 h-5 text-muted-foreground" />
            ) : (
              <span>{score}%</span>
            )}
          </div>
        </div>

        {/* Skill info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{skill.name}</p>
          <p className="text-xs text-muted-foreground truncate">{skill.description}</p>
        </div>

        {/* Action */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {getMasteryBadge(level)}
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
