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
  ArrowLeft, ChevronRight, CheckCircle2, Circle,
  Play, Map as MapIcon,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
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
    case "mastered": return <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] sm:text-xs py-0 px-1.5 sm:px-2">Mastered</Badge>;
    case "close": return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] sm:text-xs py-0 px-1.5 sm:px-2">Almost</Badge>;
    case "practicing": return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-[10px] sm:text-xs py-0 px-1.5 sm:px-2">Practicing</Badge>;
    default: return <Badge variant="secondary" className="text-[10px] sm:text-xs py-0 px-1.5 sm:px-2">New</Badge>;
  }
}

export default function SkillMap() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [selectedGrade, setSelectedGrade] = useState(1);

  useEffect(() => { document.title = "Skill Map - MathFuel"; }, []);
  useEffect(() => {
    if (!authLoading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [authLoading, isAuthenticated]);
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

  const masteryMap = useMemo(() => {
    const map = new Map<number, any>();
    if (mastery) for (const m of mastery) map.set(m.skillId, m);
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
      {/* Compact header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-11 sm:h-14">
          <div className="flex items-center gap-1.5 sm:gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-1 px-2 sm:px-3 h-8 sm:h-10 text-xs sm:text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <h1 className="font-bold text-sm sm:text-lg flex items-center gap-1.5 sm:gap-2">
              <MapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Skill Map
            </h1>
          </div>
          <div className="flex gap-1 sm:gap-2">
            {[1, 2].map((grade) => (
              <Button key={grade} variant={selectedGrade === grade ? "default" : "outline"}
                size="sm" onClick={() => setSelectedGrade(grade)}
                className="text-xs sm:text-sm h-7 sm:h-9 px-2.5 sm:px-4"
              >
                Grade {grade}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-4 sm:space-y-8 safe-bottom">
        {domainsLoading ? (
          <div className="space-y-4 sm:space-y-6">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 sm:h-48" />)}
          </div>
        ) : (
          domains?.map((domain: any, domainIndex: number) => (
            <DomainSection key={domain.id} domain={domain} index={domainIndex} masteryMap={masteryMap} />
          ))
        )}

        {!domainsLoading && (!domains || domains.length === 0) && (
          <div className="text-center py-12 sm:py-16 text-muted-foreground">
            <MapIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm sm:text-base">No skills available for Grade {selectedGrade} yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function DomainSection({ domain, index, masteryMap }: {
  domain: any; index: number; masteryMap: Map<number, any>;
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
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent p-3 sm:p-6 pb-2 sm:pb-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xl sm:text-3xl flex-shrink-0">{domain.icon}</span>
              <div className="min-w-0">
                <CardTitle className="!text-base sm:!text-xl truncate">{domain.name}</CardTitle>
                <p className="text-[10px] sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">{domain.description}</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] sm:text-sm font-medium">{domainMastery.mastered}/{domainMastery.total}</p>
              <Progress value={domainMastery.pct} className="w-14 sm:w-24 h-1.5 sm:h-2 mt-0.5 sm:mt-1" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2.5 sm:p-4">
          {isLoading ? (
            <div className="space-y-2 sm:space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 sm:h-16" />)}
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-3">
              {skills?.map((skill: any, skillIndex: number) => (
                <SkillCard key={skill.id} skill={skill} mastery={masteryMap.get(skill.id)} index={skillIndex} />
              ))}
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
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
      <div onClick={() => navigate(`/practice/${skill.id}`)}
        className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer group active:scale-[0.98]"
      >
        {/* Mastery indicator */}
        <div className="relative flex-shrink-0">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-[10px] sm:text-sm font-bold ${getMasteryColor(level)}`}>
            {level === "mastered" ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : level === "not_started" ? (
              <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
            ) : (
              <span>{score}%</span>
            )}
          </div>
        </div>

        {/* Skill info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-xs sm:text-sm truncate">{skill.name}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{skill.description}</p>
        </div>

        {/* Badge + arrow */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {getMasteryBadge(level)}
          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
