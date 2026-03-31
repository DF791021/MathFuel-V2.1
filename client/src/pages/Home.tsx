import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Brain, ChartBar as BarChart3, Sparkles, Flame, Star, Trophy, Zap, Menu, X, CheckCircle2, GraduationCap, Sliders, School, Users, MapPin, ShieldCheck } from "lucide-react";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663117001051/BAbKuMSfjHaa9ao8qByqEp/mathfuel-logo-V7jjfN52dexxQobYgXDFCk.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const ANSWERS = ["13", "15", "14", "16"];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    document.title = "MathFuel - Adaptive Math Practice for Young Learners";
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.userType === "parent") {
        navigate("/parent");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  // Auto-cycle the mockup selection to show interactivity
  useEffect(() => {
    const timers = [
      setTimeout(() => setSelected(2), 1200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen bg-[oklch(0.99_0.01_95)]">

      {/* Navigation */}
      <nav className="relative z-20 bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <img src={LOGO_URL} alt="MathFuel" className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="text-xl sm:text-2xl font-extrabold text-foreground" style={{ fontFamily: "'Chango', sans-serif" }}>
              Math<span className="text-accent">Fuel</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-3">
            <Link href="/leaderboard" className="no-underline">
              <Button variant="ghost" size="sm">Leaderboard</Button>
            </Link>
            <Link href="/pricing" className="no-underline">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link href="/login" className="no-underline">
              <Button variant="outline" size="sm">Log In</Button>
            </Link>
            <Link href="/signup" className="no-underline">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted/50 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="sm:hidden bg-white border-t border-border/50 px-4 py-4 space-y-3"
          >
            <Link href="/leaderboard" className="block no-underline">
              <Button variant="ghost" className="w-full justify-center">Leaderboard</Button>
            </Link>
            <Link href="/pricing" className="block no-underline">
              <Button variant="ghost" className="w-full justify-center">Pricing</Button>
            </Link>
            <Link href="/login" className="block no-underline">
              <Button variant="outline" className="w-full justify-center">Log In</Button>
            </Link>
            <Link href="/signup" className="block no-underline">
              <Button className="w-full justify-center bg-accent text-accent-foreground hover:bg-accent/90 font-bold">
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 pt-14 pb-16 sm:pt-20 sm:pb-24">
        {/* Subtle radial glow behind mockup */}
        <div className="pointer-events-none absolute right-0 top-0 h-[600px] w-[600px] -translate-y-1/4 translate-x-1/4 rounded-full bg-primary/8 blur-3xl" />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left — copy */}
          <div className="text-center lg:text-left">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
              className="inline-flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold mb-5 tracking-wide uppercase">
              <Star className="w-3 h-3 fill-primary" />
              Grades 1 &amp; 2 · Adaptive Math
            </motion.div>

            <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
              className="!text-4xl sm:!text-5xl lg:!text-6xl font-extrabold text-foreground !leading-[1.1] mb-5">
              Math that builds<br />
              <span className="text-primary">real confidence.</span>
            </motion.h1>

            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
              className="text-base sm:text-lg text-muted-foreground mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
              Adaptive problems, step-by-step hints, and mastery tracking — built for 6–8 year olds who are just finding their footing in math.
            </motion.p>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
              className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link href="/signup" className="no-underline">
                <Button size="lg"
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold px-8 py-6 rounded-2xl shadow-lg shadow-primary/25">
                  <Zap className="w-5 h-5 mr-2" />
                  Start Free — No Card Needed
                </Button>
              </Link>
              <a href="#how-it-works" className="no-underline">
                <Button variant="ghost" size="lg"
                  className="w-full sm:w-auto text-base px-6 py-6 rounded-2xl text-muted-foreground hover:text-foreground">
                  See how it works →
                </Button>
              </a>
            </motion.div>

            <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={4}
              className="mt-5 text-sm text-muted-foreground/80 flex items-center gap-1.5 justify-center lg:justify-start">
              <CheckCircle2 className="w-4 h-4 text-secondary shrink-0" />
              Free forever plan · No ads · Trusted by families
            </motion.p>
          </div>

          {/* Right — interactive product mockup */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="flex justify-center lg:justify-end">
            <div className="relative w-72 sm:w-80">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-3xl bg-primary/15 blur-2xl scale-105" />

              {/* Card */}
              <div className="relative bg-white rounded-3xl shadow-2xl shadow-primary/15 p-6 border border-border/50">
                {/* Header row */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-destructive" />
                    <span className="text-sm font-bold text-foreground">5 day streak!</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < 3 ? "fill-accent text-accent" : "text-muted"}`} />
                    ))}
                  </div>
                </div>

                {/* Problem */}
                <div className="text-center py-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">What is</p>
                  <p className="text-5xl font-extrabold text-foreground tracking-tight">8 + 7 = ?</p>
                </div>

                {/* Answer grid */}
                <div className="grid grid-cols-2 gap-2.5 mt-5">
                  {ANSWERS.map((ans, i) => {
                    const isSelected = selected === i;
                    const rightAnswer = i === 1; // "15" is correct: 8+7=15
                    return (
                      <button
                        key={i}
                        onClick={() => setSelected(i)}
                        className={[
                          "py-3.5 rounded-xl font-extrabold text-xl border-2 transition-all duration-200",
                          isSelected && rightAnswer
                            ? "border-secondary bg-secondary text-secondary-foreground scale-[1.03]"
                            : isSelected && !rightAnswer
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-border bg-muted/20 text-foreground hover:border-primary/40 hover:bg-primary/5",
                        ].join(" ")}
                      >
                        {ans}
                      </button>
                    );
                  })}
                </div>

                {/* Hint nudge */}
                {selected !== null && selected !== 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-start gap-2 bg-accent/15 rounded-xl px-3 py-2.5">
                    <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-accent-foreground leading-snug">
                      Not quite — try counting up from 8!
                    </p>
                  </motion.div>
                )}
                {selected === 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 bg-secondary/15 rounded-xl px-3 py-2.5">
                    <Trophy className="w-4 h-4 text-secondary shrink-0" />
                    <p className="text-xs font-bold text-secondary leading-snug">
                      🎉 Correct! Great work!
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-4 py-16 sm:py-24 bg-white/70">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-12 sm:mb-16">
            <h2 className="!text-2xl sm:!text-4xl font-extrabold text-foreground mb-3">
              Why MathFuel works when others don't
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              Three things every child needs — and most apps forget.
            </p>
          </motion.div>

          <div className="space-y-6 sm:space-y-8">
            {[
              {
                icon: <Brain className="w-7 h-7" />,
                color: "text-primary",
                bg: "bg-primary/10",
                title: "Adapts to your child, in real time",
                body: "Problems get harder when your child is on a roll, and gentler when they need support. No more frustration. No more boredom.",
              },
              {
                icon: <Sparkles className="w-7 h-7" />,
                color: "text-accent-foreground",
                bg: "bg-accent/20",
                title: "Hints that teach — not just reveal",
                body: "When a child gets stuck, step-by-step hints guide their thinking. They arrive at the answer themselves, which is how real learning sticks.",
              },
              {
                icon: <BarChart3 className="w-7 h-7" />,
                color: "text-chart-5",
                bg: "bg-chart-5/10",
                title: "Parents see everything",
                body: "A clear dashboard shows exactly what was practiced, where gaps exist, and what to focus on next. You're always in the loop.",
              },
            ].map((f, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex gap-5 sm:gap-7 items-start bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-border/40 hover:shadow-md transition-shadow">
                <div className={`shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${f.bg} ${f.color} flex items-center justify-center`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="!text-base sm:!text-lg font-bold text-foreground mb-1.5">{f.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{f.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATE STANDARDS + CUSTOMIZATION PROMO ── */}
      <section className="relative px-4 py-16 sm:py-24 bg-gradient-to-b from-primary/[0.04] to-white/70 overflow-hidden">
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-secondary/8 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-1/4 w-60 h-60 rounded-full bg-accent/8 blur-3xl" />

        <div className="relative max-w-5xl mx-auto">
          {/* Section header */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-10 sm:mb-14">
            <div className="inline-flex items-center gap-1.5 bg-secondary/15 text-secondary px-3 py-1.5 rounded-full text-xs font-bold mb-4 tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              Standards-Aligned &amp; Fully Customizable
            </div>
            <h2 className="!text-2xl sm:!text-4xl font-extrabold text-foreground mb-3">
              Ready for <em className="not-italic text-primary">your</em> state test.{" "}
              <span className="block sm:inline">Tailored to <em className="not-italic text-primary">your</em> family.</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Every MathFuel account ships pre-loaded with your state's exact math standards — so your child is practicing the <strong>right skills</strong> from day one, not catching up after test day.
            </p>
          </motion.div>

          {/* Two-column layout */}
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">

            {/* LEFT — Out of the Box */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="relative bg-white rounded-2xl p-6 sm:p-8 border border-border/40 shadow-sm hover:shadow-md transition-shadow">
              {/* Corner badge */}
              <div className="absolute -top-3 left-6 bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                Works instantly
              </div>

              <div className="flex items-center gap-3 mb-5 mt-1">
                <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="!text-lg sm:!text-xl font-bold text-foreground leading-snug">
                  State test prep — built&nbsp;in, not&nbsp;bolted&nbsp;on
                </h3>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Most apps make you hunt for the right content. MathFuel <strong>auto-detects your state</strong> and loads every standard your child will be tested on — Common Core, TEKS, SOL, you name it. No setup, no guesswork, no wasted sessions.
              </p>

              <ul className="space-y-2.5">
                {[
                  "Pre-loaded with all 50 state math frameworks",
                  "Problems mirror real standardized test formats",
                  "Gaps flagged weeks before test day — not after",
                  "Updated every school year automatically",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center gap-2 bg-primary/[0.06] rounded-xl px-3.5 py-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <p className="text-xs font-semibold text-foreground/80 leading-snug">
                  <span className="text-primary font-bold">4 out of 5 parents</span> say they didn't know their child's math app wasn't aligned to their state test.
                </p>
              </div>
            </motion.div>

            {/* RIGHT — Customize Everything */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              className="relative bg-white rounded-2xl p-6 sm:p-8 border border-border/40 shadow-sm hover:shadow-md transition-shadow">
              {/* Corner badge */}
              <div className="absolute -top-3 left-6 bg-accent text-accent-foreground text-[10px] sm:text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                Make it yours
              </div>

              <div className="flex items-center gap-3 mb-5 mt-1">
                <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent-foreground flex items-center justify-center shrink-0">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="!text-lg sm:!text-xl font-bold text-foreground leading-snug">
                  Bend it, shape it, make it <em className="not-italic text-accent-foreground">yours</em>
                </h3>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Running a district-wide rollout? Homeschooling a crew of four? Teaching a gifted second-grader college-bound fractions? Customize <strong>literally everything</strong> — skill order, difficulty curve, session length, even which standards to focus on this&nbsp;week.
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: <School className="w-4 h-4" />, label: "District & school presets" },
                  { icon: <Users className="w-4 h-4" />, label: "Multi-child profiles" },
                  { icon: <Sliders className="w-4 h-4" />, label: "Custom skill sequences" },
                  { icon: <Star className="w-4 h-4" />, label: "Pace & difficulty controls" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-accent/[0.08] rounded-xl px-3 py-2.5">
                    <span className="text-accent-foreground shrink-0">{item.icon}</span>
                    <span className="text-xs font-semibold text-foreground/80">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-2 bg-accent/[0.08] rounded-xl px-3.5 py-2.5">
                <Sparkles className="w-4 h-4 text-accent-foreground shrink-0" />
                <p className="text-xs font-semibold text-foreground/80 leading-snug">
                  Whether you're a <span className="text-accent-foreground font-bold">superintendent overseeing 10,000 students</span> or a <span className="text-accent-foreground font-bold">mom of 4 juggling homework at the kitchen table</span> — MathFuel fits the way <em>you</em> teach.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Bottom CTA strip */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
            className="mt-8 sm:mt-10 text-center">
            <Link href="/signup" className="no-underline">
              <Button size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm sm:text-base px-8 py-5 sm:py-6 rounded-2xl shadow-lg shadow-primary/25">
                <GraduationCap className="w-5 h-5 mr-2" />
                See Your State's Standards — Free
              </Button>
            </Link>
            <p className="mt-3 text-xs text-muted-foreground/70">
              Takes 30 seconds. No card required. Your child starts on the right track&nbsp;today.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="px-4 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-12 sm:mb-16">
            <h2 className="!text-2xl sm:!text-4xl font-extrabold text-foreground mb-3">
              Three minutes to mastery
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              A typical session takes less time than a TV ad break.
            </p>
          </motion.div>

          <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
            {/* Connector line on desktop */}
            <div className="hidden sm:block absolute top-8 left-[calc(16.6%+1rem)] right-[calc(16.6%+1rem)] h-px bg-border" />

            {[
              { num: "1", icon: <Zap className="w-5 h-5" />, title: "Tap Practice", desc: "10 problems perfectly matched to where your child is today." },
              { num: "2", icon: <Brain className="w-5 h-5" />, title: "Think it through", desc: "Hints guide, never give away. Each step builds the next." },
              { num: "3", icon: <Trophy className="w-5 h-5" />, title: "Celebrate growth", desc: "A session summary shows what clicked. Parents see it too." },
            ].map((step, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="relative text-center flex flex-col items-center">
                <div className="relative z-10 w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-foreground shadow-lg shadow-primary/25">
                  {step.icon}
                </div>
                <div className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-1">Step {step.num}</div>
                <h3 className="!text-base sm:!text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-16 sm:py-24 bg-primary">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="!text-2xl sm:!text-4xl font-extrabold text-primary-foreground mb-4">
              Your child's math breakthrough starts today.
            </h2>
            <p className="text-primary-foreground/75 text-sm sm:text-base mb-8 max-w-md mx-auto leading-relaxed">
              Free to start. No credit card. Real progress by the end of the first week.
            </p>
            <Link href="/signup" className="no-underline">
              <Button size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-base px-10 py-6 rounded-2xl shadow-xl shadow-black/20">
                <Zap className="w-5 h-5 mr-2" />
                Start Free Today
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-foreground/5 py-6 sm:py-8 px-4 safe-bottom">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="MathFuel" className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="font-bold text-foreground text-sm sm:text-base" style={{ fontFamily: "'Chango', sans-serif" }}>
              Math<span className="text-accent">Fuel</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            Adaptive math practice for young learners.
          </p>
          <p className="text-xs text-muted-foreground/70 text-center">
            &copy; {new Date().getFullYear()} DBB Capital Ventures LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
