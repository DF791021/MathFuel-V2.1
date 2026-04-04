import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  Brain, ChartBar as BarChart3, Sparkles, Flame, Star, Trophy, Zap, Menu, X,
  CircleCheck as CheckCircle2, ArrowRight, BookOpen, Target, TrendingUp, Users,
  Shield, ChevronRight, CirclePlay as PlayCircle, Rocket, Award, Lock
} from "lucide-react";

const LOGO_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663117001051/BAbKuMSfjHaa9ao8qByqEp/mathfuel-logo-V7jjfN52dexxQobYgXDFCk.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.09, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeIn = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

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

const DEMO_ANSWERS = ["11", "13", "12", "14"];
const DEMO_CORRECT = 1;

function SessionDemo() {
  const [phase, setPhase] = useState<"idle" | "wrong" | "correct">("idle");
  const [pick, setPick] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setPick(null); setPhase("idle");
    const t1 = setTimeout(() => { setPick(0); setPhase("wrong"); }, 1600);
    const t2 = setTimeout(() => { setPick(null); setPhase("idle"); }, 3200);
    const t3 = setTimeout(() => { setPick(DEMO_CORRECT); setPhase("correct"); }, 4500);
    const t4 = setTimeout(() => setTick(n => n + 1), 7500);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [tick]);

  const progress = phase === "correct" ? 50 : 40;

  return (
    <div className="bg-white rounded-[28px] shadow-2xl shadow-primary/20 border border-border/20 overflow-hidden w-full max-w-[360px]">
      <div
        className="px-5 pt-5 pb-4"
        style={{ background: "linear-gradient(135deg, oklch(0.44 0.20 222) 0%, oklch(0.36 0.18 240) 100%)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <img src={LOGO_URL} alt="" className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest leading-none mb-0.5">Addition</p>
              <p className="text-sm text-white font-extrabold leading-none">Level 2</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
            <Flame className="w-3.5 h-3.5 text-orange-300" />
            <span className="text-xs font-extrabold text-white">7 day streak</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, oklch(0.85 0.15 95), oklch(0.72 0.18 75))" }}
              initial={{ width: "40%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
          <span className="text-xs font-extrabold text-white/80 tabular-nums shrink-0">4 / 10</span>
        </div>
      </div>

      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3 text-center">
          What is the answer?
        </p>
        <div className="bg-gradient-to-br from-slate-50 to-blue-50/80 border border-border/40 rounded-2xl py-6 px-4 mb-5 text-center shadow-inner">
          <div className="flex items-center justify-center gap-3">
            <span className="text-[56px] font-black text-foreground leading-none tabular-nums">6</span>
            <span className="text-[36px] font-black leading-none" style={{ color: "oklch(0.44 0.20 222 / 0.5)" }}>+</span>
            <span className="text-[56px] font-black text-foreground leading-none tabular-nums">7</span>
            <span className="text-[36px] font-black leading-none" style={{ color: "oklch(0.44 0.20 222 / 0.5)" }}>=</span>
            <span className="text-[56px] font-black leading-none" style={{ color: "oklch(0.44 0.20 222)" }}>?</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {DEMO_ANSWERS.map((ans, i) => {
            const isSelected = pick === i;
            const isWrong = isSelected && i !== DEMO_CORRECT;
            const isRight = isSelected && i === DEMO_CORRECT;
            return (
              <motion.div
                key={i}
                animate={isRight ? { scale: 1.05 } : isWrong ? { x: [0, -6, 6, -4, 4, 0] } : { scale: 1, x: 0 }}
                transition={isWrong ? { duration: 0.38 } : { duration: 0.2 }}
                className={[
                  "py-[18px] rounded-2xl font-extrabold text-[28px] border-2 text-center transition-all duration-200 select-none leading-none",
                  isRight ? "border-emerald-400 bg-emerald-50 text-emerald-600 shadow-md shadow-emerald-200/50"
                    : isWrong ? "border-red-300 bg-red-50 text-red-500"
                    : "border-border/50 bg-muted/30 text-foreground hover:border-primary/30 hover:bg-primary/5",
                ].join(" ")}
              >
                {ans}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="px-5 pb-5 pt-3 min-h-[66px] flex items-center">
        <AnimatePresence mode="wait">
          {phase === "wrong" && (
            <motion.div key="wrong" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="w-full flex items-start gap-3 bg-amber-50 border border-amber-200/80 rounded-2xl px-4 py-3"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-semibold text-amber-800 leading-snug">Not quite! Try counting on 7 more from 6.</p>
            </motion.div>
          )}
          {phase === "correct" && (
            <motion.div key="correct" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex items-center gap-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl px-4 py-3"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                <Trophy className="w-3.5 h-3.5 text-white" />
              </div>
              <p className="text-xs font-bold text-emerald-700">Correct! 6 + 7 = 13. You're on a roll!</p>
            </motion.div>
          )}
          {phase === "idle" && (
            <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="w-full text-center text-xs text-muted-foreground/50"
            >
              Choose an answer above
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-border/30 grid grid-cols-3 divide-x divide-border/30">
        {[
          { label: "Accuracy", value: "88%" },
          { label: "Correct", value: "3 / 4" },
          { label: "Mastered", value: "8 skills" },
        ].map((s, i) => (
          <div key={i} className="py-3 text-center">
            <p className="text-xs font-extrabold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground/60 leading-none mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const MATH_SYMBOLS = [
  { symbol: "+", x: "8%", y: "15%", size: "2.5rem", delay: 0, dur: 7 },
  { symbol: "×", x: "92%", y: "20%", size: "2rem", delay: 1.2, dur: 9 },
  { symbol: "÷", x: "5%", y: "70%", size: "1.8rem", delay: 0.6, dur: 8 },
  { symbol: "=", x: "94%", y: "65%", size: "2.2rem", delay: 2, dur: 6.5 },
  { symbol: "π", x: "88%", y: "85%", size: "1.6rem", delay: 1.5, dur: 10 },
  { symbol: "√", x: "12%", y: "88%", size: "1.9rem", delay: 0.3, dur: 7.5 },
  { symbol: "∑", x: "50%", y: "5%", size: "1.5rem", delay: 2.5, dur: 8.5 },
  { symbol: "−", x: "78%", y: "42%", size: "2rem", delay: 0.9, dur: 6 },
];

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

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-sm shadow-black/5 border-b border-border/40"
          : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 no-underline group">
            <div className="relative">
              <img src={LOGO_URL} alt="MathFuel" className="w-9 h-9 relative z-10" />
            </div>
            <span className="text-xl font-extrabold text-foreground tracking-tight" style={{ fontFamily: "'Chango', sans-serif" }}>
              Math<span style={{ color: "oklch(0.72 0.18 75)" }}>Fuel</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {[
              { href: "/leaderboard", label: "Leaderboard" },
              { href: "/pricing", label: "Pricing" },
            ].map(item => (
              <Link key={item.href} href={item.href} className="no-underline">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground font-semibold">
                  {item.label}
                </Button>
              </Link>
            ))}
            <div className="w-px h-4 bg-border mx-2" />
            <Link href="/login" className="no-underline">
              <Button variant="ghost" size="sm" className="font-semibold">Log In</Button>
            </Link>
            <Link href="/signup" className="no-underline">
              <Button size="sm" className="font-bold px-5 rounded-xl shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5">
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
              ].map(item => (
                <Link key={item.href} href={item.href} className="block no-underline">
                  <Button variant="ghost" className="w-full justify-center font-semibold">{item.label}</Button>
                </Link>
              ))}
              <Link href="/signup" className="block no-underline">
                <Button className="w-full font-bold">Get Started Free</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 mesh-gradient" />

        {/* Large ambient orbs */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-40 animate-blob"
          style={{ background: "radial-gradient(circle, oklch(0.44 0.20 222 / 0.15) 0%, transparent 70%)" }} />
        <div className="pointer-events-none absolute bottom-0 -left-24 w-[500px] h-[500px] rounded-full opacity-30 animate-blob"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.18 75 / 0.12) 0%, transparent 70%)", animationDelay: "4s" }} />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, oklch(0.52 0.16 163 / 0.08) 0%, transparent 70%)" }} />

        {/* Floating math symbols */}
        {MATH_SYMBOLS.map((sym, i) => (
          <div
            key={i}
            className="pointer-events-none absolute font-black select-none hidden lg:flex items-center justify-center"
            style={{
              left: sym.x,
              top: sym.y,
              fontSize: sym.size,
              color: "oklch(0.44 0.20 222 / 0.08)",
              animation: `float ${sym.dur}s ease-in-out ${sym.delay}s infinite`,
            }}
          >
            {sym.symbol}
          </div>
        ))}

        {/* Subtle grid pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(oklch(0.44 0.20 222) 1px, transparent 1px), linear-gradient(90deg, oklch(0.44 0.20 222) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* Left — copy */}
            <div className="text-center lg:text-left">
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={0}
                className="flex flex-col sm:flex-row items-center lg:items-start gap-3 mb-7"
              >
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase border"
                  style={{
                    background: "oklch(0.44 0.20 222 / 0.08)",
                    borderColor: "oklch(0.44 0.20 222 / 0.2)",
                    color: "oklch(0.44 0.20 222)",
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Adaptive AI · Grades 1 &amp; 2 · Free to Start
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide border"
                  style={{
                    background: "oklch(0.52 0.16 163 / 0.10)",
                    borderColor: "oklch(0.52 0.16 163 / 0.30)",
                    color: "oklch(0.38 0.14 163)",
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  &copy; Mike Approved
                </span>
              </motion.div>

              <motion.h1
                initial="hidden" animate="visible" variants={fadeUp} custom={1}
                className="!text-[2.8rem] sm:!text-5xl lg:!text-[3.6rem] xl:!text-[4.2rem] font-extrabold !leading-[1.05] mb-6 tracking-tight text-foreground"
              >
                The math practice
                <br />that{" "}
                <span className="relative inline-block">
                  <span className="shimmer-text">actually works</span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 10" fill="none" preserveAspectRatio="none" aria-hidden="true"
                  >
                    <path d="M2 7 C60 2, 160 2, 298 7" stroke="oklch(0.72 0.18 75)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
                <br />for your child.
              </motion.h1>

              <motion.p
                initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed"
              >
                Every problem is chosen for <em className="not-italic font-bold text-foreground">your</em> child — right now, at their exact level. Adaptive difficulty, guided hints, and real mastery tracking built for ages 6–8.
              </motion.p>

              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={3}
                className="flex flex-col sm:flex-row gap-3.5 justify-center lg:justify-start mb-8"
              >
                <Link href="/signup" className="no-underline">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto text-base font-bold px-8 py-6 rounded-2xl shadow-xl shadow-primary/25 group transition-all hover:shadow-2xl hover:shadow-primary/35 hover:-translate-y-1"
                    style={{ background: "linear-gradient(135deg, oklch(0.44 0.20 222), oklch(0.36 0.18 240))" }}
                  >
                    <Rocket className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Start Free — No Card Needed
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <a href="#how-it-works" className="no-underline">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto text-base px-7 py-6 rounded-2xl border-border/80 text-foreground hover:bg-muted/60 group transition-all"
                  >
                    <PlayCircle className="w-5 h-5 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                    See how it works
                  </Button>
                </a>
              </motion.div>

              {/* Trust signals */}
              <motion.div
                initial="hidden" animate="visible" variants={fadeUp} custom={4}
                className="flex flex-wrap gap-x-6 gap-y-3 justify-center lg:justify-start"
              >
                {[
                  { icon: <CheckCircle2 className="w-4 h-4 text-secondary" />, text: "Free forever plan" },
                  { icon: <Lock className="w-4 h-4 text-secondary" />, text: "No ads, no data selling" },
                  { icon: <Users className="w-4 h-4 text-secondary" />, text: "12,400+ families" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — product mockup */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative w-full max-w-[370px]">
                {/* Floating stat badges */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -left-6 z-20 glass rounded-2xl px-4 py-2.5 shadow-lg border border-white/60 hidden sm:flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-foreground">+24% accuracy</p>
                    <p className="text-[10px] text-muted-foreground">This week</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-4 -right-4 z-20 glass rounded-2xl px-4 py-2.5 shadow-lg border border-white/60 hidden sm:flex items-center gap-2.5"
                >
                  <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Flame className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-foreground">7-day streak!</p>
                    <p className="text-[10px] text-muted-foreground">Keep it up</p>
                  </div>
                </motion.div>

                {/* Glow rings */}
                <div className="absolute inset-0 rounded-[32px] blur-2xl scale-110 opacity-60"
                  style={{ background: "radial-gradient(circle, oklch(0.44 0.20 222 / 0.15) 0%, transparent 70%)" }} />
                <div className="relative z-10">
                  <SessionDemo />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <section style={{ background: "linear-gradient(135deg, oklch(0.36 0.20 240) 0%, oklch(0.44 0.20 222) 50%, oklch(0.40 0.18 230) 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 12400, suffix: "+", label: "Families enrolled", icon: <Users className="w-5 h-5" /> },
              { value: 94, suffix: "%", label: "Accuracy improvement", icon: <TrendingUp className="w-5 h-5" /> },
              { value: 480000, suffix: "+", label: "Problems solved", icon: <Brain className="w-5 h-5" /> },
              { value: 4, suffix: ".9★", label: "Parent rating", icon: <Star className="w-5 h-5" /> },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
                className="text-center group"
              >
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-white/80">
                    {stat.icon}
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  <Counter to={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-white/65 mt-1 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section id="features" className="px-4 sm:px-6 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="text-center mb-16 sm:mb-20"
          >
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 px-4 py-2 rounded-full border"
              style={{ color: "oklch(0.44 0.20 222)", background: "oklch(0.44 0.20 222 / 0.07)", borderColor: "oklch(0.44 0.20 222 / 0.2)" }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Built differently
            </motion.div>
            <motion.h2 variants={fadeIn} className="!text-3xl sm:!text-4xl lg:!text-5xl font-extrabold text-foreground mb-5 tracking-tight">
              Why MathFuel works when<br className="hidden sm:block" /> other apps fall short
            </motion.h2>
            <motion.p variants={fadeIn} className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Three things every child needs to genuinely improve — and most apps completely forget.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: <Brain className="w-7 h-7" />,
                iconBg: "oklch(0.44 0.20 222 / 0.1)",
                iconColor: "oklch(0.44 0.20 222)",
                accentColor: "oklch(0.44 0.20 222)",
                topGradient: "linear-gradient(135deg, oklch(0.44 0.20 222), oklch(0.52 0.16 163))",
                title: "Adapts in real time",
                body: "Problems get harder when your child is on a roll, gentler when they need support. The engine tracks accuracy, speed, and hints used — not just right or wrong.",
                detail: "Powered by mastery + confidence signals",
                badge: "AI Engine",
              },
              {
                icon: <Sparkles className="w-7 h-7" />,
                iconBg: "oklch(0.72 0.18 75 / 0.1)",
                iconColor: "oklch(0.58 0.18 65)",
                accentColor: "oklch(0.72 0.18 75)",
                topGradient: "linear-gradient(135deg, oklch(0.72 0.18 75), oklch(0.78 0.18 50))",
                title: "Hints that teach, not reveal",
                body: "When stuck, step-by-step hints guide thinking. Children arrive at answers themselves — that's how learning actually sticks, not just performing.",
                detail: "AI-powered, personalized guidance",
                badge: "Hint System",
              },
              {
                icon: <BarChart3 className="w-7 h-7" />,
                iconBg: "oklch(0.52 0.16 163 / 0.1)",
                iconColor: "oklch(0.42 0.14 163)",
                accentColor: "oklch(0.52 0.16 163)",
                topGradient: "linear-gradient(135deg, oklch(0.52 0.16 163), oklch(0.44 0.14 180))",
                title: "Parents see everything",
                body: "A clear dashboard shows what was practiced, where gaps exist, and what to focus on next. Weekly summaries land in your inbox automatically.",
                detail: "Weekly email reports included",
                badge: "Parent View",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ y: -6, transition: { duration: 0.25 } }}
                className="card-shine group bg-white rounded-3xl shadow-sm border border-border/40 hover:shadow-2xl hover:shadow-black/8 transition-all duration-300 overflow-hidden"
              >
                {/* Gradient top bar */}
                <div className="h-1.5 w-full" style={{ background: f.topGradient }} />

                <div className="p-7 sm:p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: f.iconBg, color: f.iconColor }}
                    >
                      {f.icon}
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                      style={{ background: f.iconBg, color: f.iconColor }}
                    >
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="!text-xl font-extrabold text-foreground mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 text-sm sm:text-base">{f.body}</p>

                  <div className="flex items-center gap-2.5 pt-4 border-t border-border/40">
                    <div className="w-2 h-2 rounded-full" style={{ background: f.accentColor }} />
                    <span className="text-xs font-semibold text-muted-foreground">{f.detail}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MASTERY SHOWCASE ─────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-24 sm:py-32 relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, oklch(0.97 0.008 220) 0%, oklch(0.99 0.005 220) 100%)" }}
      >
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.44 0.20 222 / 0.15), transparent)" }} />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.44 0.20 222 / 0.15), transparent)" }} />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

            {/* Left — skill map */}
            <motion.div
              initial={{ opacity: 0, x: -24 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="order-2 lg:order-1"
            >
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl shadow-black/6 border border-border/40 overflow-hidden relative">
                {/* Top glow */}
                <div className="absolute top-0 left-0 right-0 h-1"
                  style={{ background: "linear-gradient(90deg, oklch(0.44 0.20 222), oklch(0.52 0.16 163), oklch(0.72 0.18 75))" }} />

                <div className="flex items-center justify-between mb-6 mt-2">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Emma's Progress</p>
                    <p className="font-extrabold text-foreground">This Week</p>
                  </div>
                  <div
                    className="text-xs font-extrabold px-3 py-1.5 rounded-full"
                    style={{ background: "oklch(0.52 0.16 163 / 0.12)", color: "oklch(0.35 0.14 163)" }}
                  >
                    +18% improvement
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { skill: "Counting to 20", pct: 92, level: "Mastered", color: "oklch(0.52 0.16 163)", bgColor: "oklch(0.52 0.16 163 / 0.12)", textColor: "oklch(0.30 0.12 163)" },
                    { skill: "Addition within 10", pct: 78, level: "Strong", color: "oklch(0.44 0.20 222)", bgColor: "oklch(0.44 0.20 222 / 0.1)", textColor: "oklch(0.30 0.16 222)" },
                    { skill: "Addition within 20", pct: 54, level: "Building", color: "oklch(0.72 0.18 75)", bgColor: "oklch(0.72 0.18 75 / 0.12)", textColor: "oklch(0.45 0.14 65)" },
                    { skill: "Subtraction basics", pct: 31, level: "Learning", color: "oklch(0.65 0.16 340)", bgColor: "oklch(0.65 0.16 340 / 0.1)", textColor: "oklch(0.45 0.14 340)" },
                  ].map((row, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-foreground">{row.skill}</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                          style={{ background: row.bgColor, color: row.textColor }}
                        >
                          {row.level}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: row.color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${row.pct}%` }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 + 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-border/50 grid grid-cols-4 gap-4">
                  {[
                    { value: "14", label: "Sessions" },
                    { value: "186", label: "Problems" },
                    { value: "9", label: "Day streak", icon: <Flame className="w-3.5 h-3.5 text-orange-500" /> },
                    { value: "88%", label: "Accuracy" },
                  ].map((s, i) => (
                    <div key={i} className="text-center">
                      <p className="text-lg font-extrabold text-foreground flex items-center justify-center gap-1">
                        {s.icon}{s.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right — copy */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
              className="order-1 lg:order-2 text-center lg:text-left"
            >
              <motion.div variants={fadeIn}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 px-4 py-2 rounded-full border"
                style={{ color: "oklch(0.44 0.20 222)", background: "oklch(0.44 0.20 222 / 0.07)", borderColor: "oklch(0.44 0.20 222 / 0.2)" }}
              >
                For parents
              </motion.div>
              <motion.h2 variants={fadeIn}
                className="!text-3xl sm:!text-4xl font-extrabold text-foreground mb-5 tracking-tight leading-tight"
              >
                Know exactly where<br />your child stands.
              </motion.h2>
              <motion.p variants={fadeIn} className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
                No more guessing if practice is helping. MathFuel's parent dashboard shows skill-by-skill mastery, weekly trends, and what to focus on next — in plain English.
              </motion.p>

              <motion.div variants={stagger} className="space-y-4 text-left max-w-md mx-auto lg:mx-0 mb-8">
                {[
                  { icon: <BookOpen className="w-4 h-4" />, text: "Skill-level mastery tracked automatically", color: "oklch(0.44 0.20 222)" },
                  { icon: <TrendingUp className="w-4 h-4" />, text: "Weekly progress email every Monday", color: "oklch(0.52 0.16 163)" },
                  { icon: <Target className="w-4 h-4" />, text: "\"What to practice next\" AI recommendations", color: "oklch(0.58 0.18 65)" },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeIn} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color.replace(")", " / 0.1)")}`, color: item.color }}
                    >
                      {item.icon}
                    </div>
                    <span className="text-sm sm:text-base text-foreground font-medium">{item.text}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div variants={fadeIn}>
                <Link href="/signup" className="no-underline">
                  <Button
                    className="font-bold px-7 py-6 text-base rounded-2xl shadow-lg shadow-primary/20 group transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, oklch(0.44 0.20 222), oklch(0.36 0.18 240))" }}
                  >
                    Create a free account
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 py-24 sm:py-32 bg-background">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="text-center mb-14"
          >
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 px-4 py-2 rounded-full border"
              style={{ color: "oklch(0.44 0.20 222)", background: "oklch(0.44 0.20 222 / 0.07)", borderColor: "oklch(0.44 0.20 222 / 0.2)" }}
            >
              Real families
            </motion.div>
            <motion.h2 variants={fadeIn} className="!text-3xl sm:!text-4xl font-extrabold text-foreground tracking-tight mb-3">
              Parents love what they see.
            </motion.h2>
            <motion.p variants={fadeIn} className="text-muted-foreground text-lg">
              Join 12,400+ families already using MathFuel.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                name: "Sarah M.",
                role: "Mom of a 7-year-old",
                stars: 5,
                quote: "My daughter used to dread math homework. Two weeks into MathFuel and she's asking to practice before school. The hints are the secret — she feels like she figured it out herself.",
                img: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=2",
                accent: "oklch(0.44 0.20 222)",
                accentBg: "oklch(0.44 0.20 222 / 0.06)",
              },
              {
                name: "James T.",
                role: "Dad of two, ages 6 & 8",
                stars: 5,
                quote: "What sold me was the parent dashboard. I can see exactly what they're working on, what's clicking, and what needs more practice. It's the accountability tool I was missing.",
                img: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=2",
                accent: "oklch(0.52 0.16 163)",
                accentBg: "oklch(0.52 0.16 163 / 0.06)",
              },
              {
                name: "Priya K.",
                role: "Mom of a 1st grader",
                stars: 5,
                quote: "We tried three other apps. This is the only one where I actually see my son getting better, not just clicking through. The adaptive difficulty keeps him challenged without frustration.",
                img: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&dpr=2",
                accent: "oklch(0.72 0.18 75)",
                accentBg: "oklch(0.72 0.18 75 / 0.06)",
              },
            ].map((t, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="card-shine bg-white rounded-3xl shadow-sm border border-border/40 hover:shadow-xl hover:shadow-black/8 transition-all duration-300 flex flex-col overflow-hidden"
              >
                <div className="h-1" style={{ background: `linear-gradient(90deg, ${t.accent}, ${t.accent.replace(")", " / 0.4)")})` }} />
                <div className="p-7 flex flex-col flex-1">
                  <div className="flex items-center gap-0.5 mb-5">
                    {[...Array(t.stars)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="text-foreground text-sm sm:text-base leading-relaxed mb-6 flex-1 font-medium">
                    "{t.quote}"
                  </blockquote>
                  <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                    <img
                      src={t.img}
                      alt={t.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-border/40 flex-shrink-0"
                    />
                    <div>
                      <p className="font-extrabold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                    <div className="ml-auto">
                      <Award className="w-5 h-5" style={{ color: t.accent }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="px-4 sm:px-6 py-24 sm:py-32 relative overflow-hidden"
        style={{ background: "linear-gradient(180deg, oklch(0.97 0.008 220) 0%, oklch(0.99 0.005 220) 100%)" }}
      >
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, oklch(0.44 0.20 222 / 0.15), transparent)" }} />

        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="text-center mb-14 sm:mb-18"
          >
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4 px-4 py-2 rounded-full border"
              style={{ color: "oklch(0.44 0.20 222)", background: "oklch(0.44 0.20 222 / 0.07)", borderColor: "oklch(0.44 0.20 222 / 0.2)" }}
            >
              Simple by design
            </motion.div>
            <motion.h2 variants={fadeIn} className="!text-3xl sm:!text-4xl font-extrabold text-foreground tracking-tight mb-4">
              Up and running in 60 seconds.
            </motion.h2>
            <motion.p variants={fadeIn} className="text-base sm:text-lg text-muted-foreground max-w-md mx-auto">
              A typical session takes less time than a TV ad break.
            </motion.p>
          </motion.div>

          <div className="relative grid md:grid-cols-3 gap-8 md:gap-6">
            <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-px"
              style={{ background: "linear-gradient(90deg, oklch(0.44 0.20 222 / 0.3), oklch(0.72 0.18 75 / 0.3))" }} />

            {[
              {
                num: "01", icon: <Zap className="w-6 h-6" />,
                title: "Pick a session",
                desc: "Choose a skill focus or let MathFuel decide. 10 problems, chosen exactly for where your child is today.",
                gradient: "linear-gradient(135deg, oklch(0.44 0.20 222), oklch(0.52 0.16 163))",
              },
              {
                num: "02", icon: <Brain className="w-6 h-6" />,
                title: "Think it through",
                desc: "Hints guide, never give away. Each step builds the next. Children learn to think, not just click.",
                gradient: "linear-gradient(135deg, oklch(0.52 0.16 163), oklch(0.44 0.14 180))",
              },
              {
                num: "03", icon: <Trophy className="w-6 h-6" />,
                title: "Celebrate real growth",
                desc: "A session summary shows what clicked. Mastery updates. Parents see it too, no login required.",
                gradient: "linear-gradient(135deg, oklch(0.72 0.18 75), oklch(0.65 0.16 55))",
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="relative text-center flex flex-col items-center"
              >
                <div className="relative z-10 mb-5">
                  <div className="w-20 h-20 bg-white border border-border/50 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{ background: step.gradient }}
                    >
                      {step.icon}
                    </div>
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-foreground text-background text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-sm">
                    {i + 1}
                  </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: "oklch(0.44 0.20 222 / 0.45)" }}>
                  {step.num}
                </p>
                <h3 className="!text-base sm:!text-lg font-extrabold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 py-24 sm:py-32 overflow-hidden"
        style={{ background: "linear-gradient(135deg, oklch(0.30 0.18 240) 0%, oklch(0.44 0.20 222) 40%, oklch(0.38 0.18 235) 70%, oklch(0.34 0.16 245) 100%)" }}
      >
        {/* Decorative elements */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 bottom-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, white 1.5px, transparent 1.5px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="pointer-events-none absolute -top-32 right-0 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.72 0.18 75 / 0.15) 0%, transparent 60%)" }} />
        <div className="pointer-events-none absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(circle, oklch(0.52 0.16 163 / 0.12) 0%, transparent 60%)" }} />

        {/* Floating orbs */}
        <div className="pointer-events-none absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-white/10 animate-float" />
        <div className="pointer-events-none absolute top-3/4 right-1/4 w-6 h-6 rounded-full bg-white/8 animate-float-delayed" />
        <div className="pointer-events-none absolute top-1/2 right-1/6 w-3 h-3 rounded-full bg-white/12 animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            <motion.div variants={fadeIn}
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/90 text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest mb-7"
            >
              <Sparkles className="w-3.5 h-3.5" /> Free for life — no credit card
            </motion.div>

            <motion.h2 variants={fadeIn}
              className="!text-3xl sm:!text-4xl lg:!text-5xl font-extrabold text-white !leading-tight mb-5 tracking-tight"
            >
              Your child's math<br />breakthrough starts today.
            </motion.h2>

            <motion.p variants={fadeIn} className="text-white/70 text-base sm:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
              Free to start. Real progress within the first week. No ads, no gimmicks — just genuine learning built around your child.
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="no-underline">
                <Button
                  size="lg"
                  className="bg-white hover:bg-white/95 font-extrabold text-base px-10 py-6 rounded-2xl shadow-2xl shadow-black/20 group transition-all hover:shadow-3xl hover:-translate-y-1"
                  style={{ color: "oklch(0.44 0.20 222)" }}
                >
                  <Rocket className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Start Free Today
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/pricing" className="no-underline">
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white/80 hover:text-white hover:bg-white/10 font-semibold text-base px-8 py-6 rounded-2xl border border-white/20 transition-all"
                >
                  View pricing
                </Button>
              </Link>
            </motion.div>

            {/* Stars row */}
            <motion.div variants={fadeIn} className="flex items-center justify-center gap-2 mt-8">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-300 text-amber-300" />)}
              </div>
              <span className="text-white/60 text-sm font-medium">4.9 rating · 12,400+ families</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="py-12 sm:py-14 px-4 sm:px-6 safe-bottom"
        style={{ background: "oklch(0.10 0.02 235)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-10">
            <div className="flex flex-col items-center md:items-start gap-3">
              <div className="flex items-center gap-2.5">
                <img src={LOGO_URL} alt="MathFuel" className="w-8 h-8 opacity-90" />
                <span className="font-extrabold text-white text-xl" style={{ fontFamily: "'Chango', sans-serif" }}>
                  Math<span style={{ color: "oklch(0.72 0.18 75)" }}>Fuel</span>
                </span>
              </div>
              <p className="text-sm max-w-[200px] text-center md:text-left leading-relaxed" style={{ color: "oklch(0.60 0.04 220)" }}>
                Adaptive math practice for young learners, ages 6–8.
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-3 text-sm">
              {[
                { href: "/leaderboard", label: "Leaderboard" },
                { href: "/pricing", label: "Pricing" },
                { href: "/login", label: "Log In" },
                { href: "/signup", label: "Sign Up Free" },
              ].map(link => (
                <Link
                  key={link.href} href={link.href}
                  className="no-underline font-medium transition-colors"
                  style={{ color: "oklch(0.55 0.04 220)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
            style={{ borderColor: "oklch(1 0 0 / 6%)" }}
          >
            <p className="text-xs" style={{ color: "oklch(0.45 0.03 220)" }}>
              &copy; {new Date().getFullYear()} DBB Capital Ventures LLC. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: "oklch(0.45 0.03 220)" }}>
              Designed for real learning. Built with care.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
