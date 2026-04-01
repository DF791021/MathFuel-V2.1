import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Brain, ChartBar as BarChart3, Sparkles, Flame, Star, Trophy, Zap, Menu, X, CircleCheck as CheckCircle2, ArrowRight, BookOpen, Target, TrendingUp, Users, Shield, ChevronRight, CirclePlay as PlayCircle } from "lucide-react";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663117001051/BAbKuMSfjHaa9ao8qByqEp/mathfuel-logo-V7jjfN52dexxQobYgXDFCk.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(start);
    }, 20);
    return () => clearInterval(timer);
  }, [inView, to]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ── Demo session cycling ─────────────────────────────────────────────────────
const DEMO_ANSWERS = ["11", "13", "12", "14"];
const DEMO_CORRECT = 1; // "13" = 6+7

function SessionDemo() {
  const [phase, setPhase] = useState<"idle" | "wrong" | "correct">("idle");
  const [pick, setPick] = useState<number | null>(null);

  useEffect(() => {
    const t1 = setTimeout(() => { setPick(0); setPhase("wrong"); }, 1800);
    const t2 = setTimeout(() => { setPick(null); setPhase("idle"); }, 3600);
    const t3 = setTimeout(() => { setPick(DEMO_CORRECT); setPhase("correct"); }, 4800);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, []);

  return (
    <div className="bg-white rounded-3xl shadow-2xl shadow-primary/10 border border-border/40 p-6 w-full max-w-[340px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <img src={LOGO_URL} alt="" className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-foreground">Addition — Level 2</span>
        </div>
        <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-full">
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span className="text-xs font-bold text-orange-600">7 streak</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted rounded-full mb-5 overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: "40%" }}
          animate={{ width: phase === "correct" ? "60%" : "40%" }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Problem */}
      <div className="text-center py-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Solve</p>
        <p className="text-6xl font-extrabold text-foreground tracking-tight tabular-nums">6 + 7 = ?</p>
      </div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        {DEMO_ANSWERS.map((ans, i) => {
          const isSelected = pick === i;
          const isWrong = isSelected && i !== DEMO_CORRECT;
          const isRight = isSelected && i === DEMO_CORRECT;
          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={[
                "py-4 rounded-2xl font-extrabold text-2xl border-2 transition-all duration-200 select-none",
                isRight ? "border-secondary bg-secondary/10 text-secondary scale-[1.03]" :
                  isWrong ? "border-destructive bg-destructive/8 text-destructive" :
                    "border-border/60 bg-muted/30 text-foreground hover:border-primary/40 hover:bg-primary/5",
              ].join(" ")}
            >
              {ans}
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      <div className="mt-4 min-h-[52px]">
        <AnimatePresence mode="wait">
          {phase === "wrong" && (
            <motion.div
              key="wrong"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-3.5 py-3"
            >
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-amber-800 leading-snug">
                Not quite — try counting on 7 more from 6!
              </p>
            </motion.div>
          )}
          {phase === "correct" && (
            <motion.div
              key="correct"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-3"
            >
              <Trophy className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-xs font-bold text-emerald-700">Correct! You're on a roll!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Floating badge component ─────────────────────────────────────────────────
function FloatingBadge({
  icon,
  label,
  value,
  className,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`absolute bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg shadow-black/8 border border-white/80 px-3.5 py-2.5 flex items-center gap-2.5 ${className}`}
    >
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
        <p className="text-sm font-bold text-foreground leading-none">{value}</p>
      </div>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { document.title = "MathFuel — Adaptive Math Practice for Young Learners"; }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.userType === "parent" ? "/parent" : "/dashboard");
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-border/50" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline group">
            <img src={LOGO_URL} alt="MathFuel" className="w-9 h-9" />
            <span className="text-xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: "'Chango', sans-serif" }}>
              Math<span className="text-accent">Fuel</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <Link href="/leaderboard" className="no-underline">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">
                Leaderboard
              </Button>
            </Link>
            <Link href="/pricing" className="no-underline">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-medium">
                Pricing
              </Button>
            </Link>
            <div className="w-px h-4 bg-border mx-2" />
            <Link href="/login" className="no-underline">
              <Button variant="ghost" size="sm" className="font-medium">Log In</Button>
            </Link>
            <Link href="/signup" className="no-underline">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 rounded-xl">
                Get Started Free
              </Button>
            </Link>
          </div>

          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-muted/60 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-border/50 px-4 pb-4 space-y-2 overflow-hidden"
            >
              {[
                { href: "/leaderboard", label: "Leaderboard" },
                { href: "/pricing", label: "Pricing" },
                { href: "/login", label: "Log In" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="block no-underline">
                  <Button variant="ghost" className="w-full justify-center">{item.label}</Button>
                </Link>
              ))}
              <Link href="/signup" className="block no-underline">
                <Button className="w-full bg-primary text-primary-foreground font-bold">Get Started Free</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Background treatment */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-background to-blue-50/40" />
        <div className="pointer-events-none absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary/6 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full bg-accent/10 blur-[100px]" />

        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(oklch(0.18 0.04 222) 1px, transparent 1px), linear-gradient(90deg, oklch(0.18 0.04 222) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* Left — copy */}
            <div className="text-center lg:text-left">
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={0}
                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold mb-6 tracking-widest uppercase border border-primary/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Adaptive AI · Grades 1 &amp; 2 · Free to Start
              </motion.div>

              <motion.h1
                initial="hidden" animate="visible" variants={fadeUp} custom={1}
                className="!text-[2.6rem] sm:!text-5xl lg:!text-[3.5rem] xl:!text-[4rem] font-extrabold text-foreground !leading-[1.08] mb-6 tracking-tight"
              >
                Math practice that{" "}
                <span className="relative inline-block">
                  <span className="relative z-10 text-primary">actually works</span>
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d="M2 9 C50 3, 150 3, 298 9" stroke="oklch(0.72 0.18 75)" strokeWidth="4" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
                <br />for your child.
              </motion.h1>

              <motion.p
                initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
              >
                Every problem is chosen for <em>your</em> child — right now, at their level. Adaptive difficulty, guided hints, and real mastery tracking built for ages 6–8.
              </motion.p>

              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={3}
                className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start mb-8"
              >
                <Link href="/signup" className="no-underline">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold px-8 py-6 rounded-2xl shadow-lg shadow-primary/30 group"
                  >
                    <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Start Free — No Card Needed
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
                <a href="#how-it-works" className="no-underline">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-base px-7 py-6 rounded-2xl border-border/70 text-foreground hover:bg-muted/50 group"
                  >
                    <PlayCircle className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                    See how it works
                  </Button>
                </a>
              </motion.div>

              {/* Trust signals */}
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={4}
                className="flex flex-wrap gap-x-5 gap-y-2 justify-center lg:justify-start"
              >
                {[
                  { icon: <CheckCircle2 className="w-4 h-4 text-secondary" />, text: "Free forever plan" },
                  { icon: <Shield className="w-4 h-4 text-secondary" />, text: "No ads. No data selling" },
                  { icon: <Users className="w-4 h-4 text-secondary" />, text: "12,400+ families" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — product mockup with floating badges */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-[380px]">
                {/* Soft glow */}
                <div className="absolute inset-8 bg-primary/15 blur-3xl rounded-full" />

                {/* Floating badges */}
                <FloatingBadge
                  icon={<TrendingUp className="w-4 h-4 text-primary" />}
                  label="Accuracy this week"
                  value="↑ 94%"
                  className="-left-6 top-8"
                  delay={0.8}
                />
                <FloatingBadge
                  icon={<Target className="w-4 h-4 text-secondary" />}
                  label="Skills mastered"
                  value="8 skills"
                  className="-right-4 bottom-16"
                  delay={1.0}
                />

                {/* Session card */}
                <div className="relative z-10">
                  <SessionDemo />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────────── */}
      <section className="bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: 12400, suffix: "+", label: "Families enrolled" },
            { value: 94, suffix: "%", label: "Accuracy improvement" },
            { value: 480000, suffix: "+", label: "Problems solved" },
            { value: 4, suffix: ".9★", label: "Parent rating" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              className="text-center"
            >
              <p className="text-3xl sm:text-4xl font-extrabold text-primary-foreground tracking-tight">
                <Counter to={stat.value} suffix={stat.suffix} />
              </p>
              <p className="text-sm text-primary-foreground/70 mt-1 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-14 sm:mb-20"
          >
            <motion.p variants={fadeIn} className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              Built differently
            </motion.p>
            <motion.h2 variants={fadeIn} className="!text-3xl sm:!text-4xl lg:!text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              Why MathFuel works when<br className="hidden sm:block" /> other apps fall short
            </motion.h2>
            <motion.p variants={fadeIn} className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Three things every child needs to genuinely improve — and most apps forget.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain className="w-8 h-8" />,
                color: "text-primary",
                bg: "bg-primary/8",
                ring: "ring-primary/20",
                accent: "bg-primary",
                title: "Adapts in real time",
                body: "Problems get harder when your child is on a roll, gentler when they need support. The engine tracks accuracy, speed, and hints used — not just right or wrong.",
                detail: "Powered by mastery + confidence signals",
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                color: "text-amber-600",
                bg: "bg-amber-50",
                ring: "ring-amber-200",
                accent: "bg-accent",
                title: "Hints that teach, not reveal",
                body: "When stuck, step-by-step hints guide thinking. Children arrive at answers themselves — that's how learning actually sticks, not just performing.",
                detail: "AI-powered, personalized guidance",
              },
              {
                icon: <BarChart3 className="w-8 h-8" />,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
                ring: "ring-emerald-200",
                accent: "bg-secondary",
                title: "Parents see everything",
                body: "A clear dashboard shows what was practiced, where gaps exist, and what to focus on next. Weekly summaries land in your inbox automatically.",
                detail: "Weekly email reports included",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4 }}
                className="group bg-white rounded-3xl p-7 sm:p-8 shadow-sm border border-border/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl ${f.bg} ${f.color} ring-1 ${f.ring} flex items-center justify-center mb-6`}>
                  {f.icon}
                </div>
                <h3 className="!text-lg sm:!text-xl font-bold text-foreground mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-5 text-sm sm:text-base">{f.body}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${f.accent}`} />
                  <span className="text-xs font-semibold text-muted-foreground">{f.detail}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MASTERY SHOWCASE ────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-20 sm:py-28 bg-slate-50/80">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* Left — skill map visual */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="order-2 lg:order-1"
            >
              <div className="bg-white rounded-3xl p-6 shadow-lg shadow-black/5 border border-border/50">
                {/* Mini mastery dashboard */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Emma's Progress</p>
                    <p className="font-bold text-foreground text-sm">This Week</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    +18% improvement
                  </div>
                </div>

                <div className="space-y-3.5">
                  {[
                    { skill: "Counting to 20", pct: 92, level: "Mastered" },
                    { skill: "Addition within 10", pct: 78, level: "Strong" },
                    { skill: "Addition within 20", pct: 54, level: "Building" },
                    { skill: "Subtraction basics", pct: 31, level: "Learning" },
                  ].map((row, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-foreground">{row.skill}</span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            row.pct >= 80
                              ? "bg-emerald-50 text-emerald-700"
                              : row.pct >= 50
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {row.level}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            row.pct >= 80 ? "bg-secondary" : row.pct >= 50 ? "bg-primary" : "bg-accent"
                          }`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${row.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 + 0.3, duration: 0.7 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-foreground">14</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-foreground">186</p>
                    <p className="text-xs text-muted-foreground">Problems</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-foreground flex items-center gap-1 justify-center">
                      <Flame className="w-4 h-4 text-orange-500" />9
                    </p>
                    <p className="text-xs text-muted-foreground">Day streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-extrabold text-foreground">88%</p>
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right — copy */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="order-1 lg:order-2 text-center lg:text-left"
            >
              <motion.p variants={fadeIn} className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
                For parents
              </motion.p>
              <motion.h2 variants={fadeIn} className="!text-3xl sm:!text-4xl font-extrabold text-foreground mb-5 tracking-tight">
                Know exactly where your child stands.
              </motion.h2>
              <motion.p variants={fadeIn} className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                No more guessing if practice is helping. MathFuel's parent dashboard shows skill-by-skill mastery, weekly trends, and what to focus on next — in plain English.
              </motion.p>

              <motion.div variants={stagger} className="space-y-4 text-left max-w-md mx-auto lg:mx-0 mb-8">
                {[
                  { icon: <BookOpen className="w-4 h-4 text-primary" />, text: "Skill-level mastery tracked automatically" },
                  { icon: <TrendingUp className="w-4 h-4 text-secondary" />, text: "Weekly progress email every Monday" },
                  { icon: <Target className="w-4 h-4 text-accent-foreground" />, text: "\"What to practice next\" recommendations" },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeIn} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-sm sm:text-base text-foreground font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div variants={fadeIn}>
                <Link href="/signup" className="no-underline">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-7 py-6 text-base rounded-2xl shadow-md shadow-primary/20 group">
                    Create a free account
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-14"
          >
            <motion.p variants={fadeIn} className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              Real families
            </motion.p>
            <motion.h2 variants={fadeIn} className="!text-3xl sm:!text-4xl font-extrabold text-foreground tracking-tight">
              Parents love what they see.
            </motion.h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah M.",
                role: "Mom of a 7-year-old",
                stars: 5,
                quote: "My daughter used to dread math homework. Two weeks into MathFuel and she's asking to practice before school. The hints are the secret — she feels like she figured it out herself.",
                initials: "SM",
                color: "bg-blue-100 text-blue-700",
              },
              {
                name: "James T.",
                role: "Dad of two, 6 &amp; 8",
                stars: 5,
                quote: "What sold me was the parent dashboard. I can see exactly what they're working on, what's clicking, and what needs more practice. It's the accountability tool I was missing.",
                initials: "JT",
                color: "bg-emerald-100 text-emerald-700",
              },
              {
                name: "Priya K.",
                role: "Mom of a 1st grader",
                stars: 5,
                quote: "We tried three other apps. This is the only one where I actually see my son getting better, not just clicking through. The adaptive difficulty keeps him challenged without frustration.",
                initials: "PK",
                color: "bg-amber-100 text-amber-700",
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-3xl p-7 shadow-sm border border-border/50 flex flex-col"
              >
                <div className="flex items-center gap-0.5 mb-5">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                  ))}
                </div>
                <blockquote className="text-foreground text-sm sm:text-base leading-relaxed mb-6 flex-1">
                  "{t.quote}"
                </blockquote>
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-sm font-bold shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm" dangerouslySetInnerHTML={{ __html: t.name }} />
                    <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: t.role }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-4 sm:px-6 py-20 sm:py-28 bg-slate-50/80">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-14 sm:mb-18"
          >
            <motion.p variants={fadeIn} className="text-xs font-bold text-primary uppercase tracking-widest mb-3">
              Simple by design
            </motion.p>
            <motion.h2 variants={fadeIn} className="!text-3xl sm:!text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Up and running in 60 seconds.
            </motion.h2>
            <motion.p variants={fadeIn} className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
              A typical session takes less time than a TV ad break.
            </motion.p>
          </motion.div>

          <div className="relative grid md:grid-cols-3 gap-8 md:gap-6">
            {/* Connector */}
            <div className="hidden md:block absolute top-10 left-[calc(50%/3+4rem)] right-[calc(50%/3+4rem)] h-px bg-gradient-to-r from-border via-primary/30 to-border" />

            {[
              {
                num: "01",
                icon: <Zap className="w-6 h-6" />,
                title: "Pick a session",
                desc: "Choose a skill focus or let MathFuel decide. 10 problems, chosen exactly for where your child is today.",
              },
              {
                num: "02",
                icon: <Brain className="w-6 h-6" />,
                title: "Think it through",
                desc: "Hints guide, never give away. Each step builds the next. Children learn to think, not just click.",
              },
              {
                num: "03",
                icon: <Trophy className="w-6 h-6" />,
                title: "Celebrate real growth",
                desc: "A session summary shows what clicked. Mastery updates. Parents see it too, no login required.",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative text-center flex flex-col items-center"
              >
                <div className="relative z-10 w-20 h-20 bg-white border-2 border-border rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm group-hover:border-primary/30 transition-colors">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-md shadow-primary/30">
                    {step.icon}
                  </div>
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-foreground text-background text-xs font-extrabold rounded-full flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <p className="text-[10px] font-black text-primary/50 uppercase tracking-[0.2em] mb-1.5">{step.num}</p>
                <h3 className="!text-base sm:!text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 py-20 sm:py-28 overflow-hidden bg-primary">
        <div className="pointer-events-none absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 w-[300px] h-[300px] rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Free for life — no credit card
            </motion.div>

            <motion.h2 variants={fadeIn} className="!text-3xl sm:!text-4xl lg:!text-5xl font-extrabold text-white !leading-tight mb-5 tracking-tight">
              Your child's math<br />breakthrough starts today.
            </motion.h2>

            <motion.p variants={fadeIn} className="text-primary-foreground/75 text-base sm:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Free to start. Real progress within the first week. No ads, no gimmicks — just genuine learning.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-3.5 justify-center">
              <Link href="/signup" className="no-underline">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-bold text-base px-10 py-6 rounded-2xl shadow-xl shadow-black/20 group"
                >
                  <Zap className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Start Free Today
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
              <Link href="/pricing" className="no-underline">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white/80 hover:text-white hover:bg-white/10 font-medium text-base px-8 py-6 rounded-2xl"
                >
                  View pricing
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-foreground text-background/80 py-10 sm:py-12 px-4 sm:px-6 safe-bottom">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-8">
            {/* Brand */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-2.5">
                <img src={LOGO_URL} alt="MathFuel" className="w-8 h-8 opacity-90" />
                <span className="font-bold text-background text-lg" style={{ fontFamily: "'Chango', sans-serif" }}>
                  Math<span className="text-accent">Fuel</span>
                </span>
              </div>
              <p className="text-sm text-background/50 max-w-[200px] text-center md:text-left leading-relaxed">
                Adaptive math practice for young learners, ages 6–8.
              </p>
            </div>

            {/* Nav links */}
            <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-3 text-sm">
              {[
                { href: "/leaderboard", label: "Leaderboard" },
                { href: "/pricing", label: "Pricing" },
                { href: "/login", label: "Log In" },
                { href: "/signup", label: "Sign Up" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="no-underline text-background/60 hover:text-background transition-colors font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-background/40">
              &copy; {new Date().getFullYear()} DBB Capital Ventures LLC. All rights reserved.
            </p>
            <p className="text-xs text-background/40">
              Designed for real learning. Built with care.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
