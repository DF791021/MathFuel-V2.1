import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  Play, Brain, Target, BarChart3, Shield, Sparkles,
  ChevronRight, Flame, Star, Trophy, Zap, Heart
} from "lucide-react";
import { getLoginUrl } from "@/const";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = "MathFuel - Adaptive Math Practice for Young Learners";
  }, []);

  // If logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.userType === "parent") {
        navigate("/parent");
      } else {
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const features = [
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Adaptive Difficulty",
      description: "Problems get harder when your child is ready, and easier when they need support. No frustration, no boredom.",
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Mastery-Based",
      description: "Skills are tracked from 'not started' to 'mastered'. Your child moves forward only when they truly understand.",
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: "Scaffolded Hints",
      description: "When stuck, children get step-by-step hints that teach thinking — not just the answer.",
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Parent Dashboard",
      description: "See exactly what your child practiced, where they struggled, and what to work on next.",
      color: "text-chart-5",
      bg: "bg-chart-5/10",
    },
    {
      icon: <Flame className="w-8 h-8" />,
      title: "Streaks & Rewards",
      description: "Daily streaks, badges, and celebrations keep kids coming back. Practice becomes a habit, not a chore.",
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Safe & Simple",
      description: "No ads, no distractions. Big buttons, clear text, and a calm interface designed for 6-8 year olds.",
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  const skillAreas = [
    { emoji: "🔢", name: "Counting & Number Sense", desc: "Count, compare, and order numbers" },
    { emoji: "➕", name: "Addition", desc: "Add within 20, then within 100" },
    { emoji: "➖", name: "Subtraction", desc: "Subtract within 20, then within 100" },
    { emoji: "📏", name: "Place Value", desc: "Tens and ones, expanded form" },
    { emoji: "📐", name: "Measurement", desc: "Length, time, and money basics" },
    { emoji: "📖", name: "Word Problems", desc: "Real-world math stories" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-amber-50/30">
      {/* Floating Math Symbols */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {["➕", "➖", "✕", "÷", "=", "🔢"].map((sym, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -15 + i * 5, 0], rotate: [0, 5 - i * 2, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, delay: i * 0.5 }}
            className="absolute text-4xl opacity-10"
            style={{
              top: `${15 + i * 13}%`,
              left: i % 2 === 0 ? `${5 + i * 3}%` : undefined,
              right: i % 2 === 1 ? `${5 + i * 3}%` : undefined,
            }}
          >
            {sym}
          </motion.div>
        ))}
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663117001051/BAbKuMSfjHaa9ao8qByqEp/mathfuel-logo-V7jjfN52dexxQobYgXDFCk.webp"
              alt="MathFuel"
              className="w-10 h-10"
            />
            <span className="text-2xl font-extrabold text-foreground" style={{ fontFamily: "'Chango', sans-serif" }}>
              Math<span className="text-accent">Fuel</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a href={getLoginUrl()} className="no-underline">
              <Button variant="outline" size="sm">Log In</Button>
            </a>
            <a href={getLoginUrl()} className="no-underline">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                Get Started Free
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 bg-accent/15 text-accent-foreground px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Star className="w-4 h-4 text-accent" />
              Built for Grades 1 & 2
            </div>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-tight mb-6"
          >
            Math practice that{" "}
            <span className="text-primary">actually works</span>
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Adaptive difficulty. Scaffolded hints. Real mastery tracking.
            MathFuel builds confidence — not just correct answers.
          </motion.p>

          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a href={getLoginUrl()} className="no-underline">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-2xl shadow-lg shadow-primary/25">
                <Play className="w-5 h-5 mr-2" />
                Start Practicing Free
              </Button>
            </a>
            <a href="#features" className="no-underline">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 rounded-2xl">
                See How It Works
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </a>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-14"
          >
            {[
              { value: "200+", label: "Problems" },
              { value: "7", label: "Skill Areas" },
              { value: "5", label: "Difficulty Levels" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative z-10 py-20 px-4 bg-white/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Why parents love MathFuel
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Every feature is designed to build real understanding, not just speed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="h-full border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <CardContent className="p-6">
                    <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-4 ${feature.color}`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Areas */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              What your child will practice
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Aligned with Grade 1-2 standards. Every skill builds on the last.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {skillAreas.map((skill, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-all hover:scale-[1.02] bg-white cursor-default">
                  <CardContent className="p-5 text-center">
                    <div className="text-4xl mb-3">{skill.emoji}</div>
                    <h3 className="font-bold text-foreground mb-1 text-sm sm:text-base">{skill.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{skill.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 py-20 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              How a session works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                icon: <Play className="w-6 h-6" />,
                title: "Start a session",
                desc: "Your child taps 'Practice' and gets 10 problems matched to their level.",
              },
              {
                step: "2",
                icon: <Brain className="w-6 h-6" />,
                title: "Solve with support",
                desc: "If stuck, hints appear one at a time — teaching the thinking, not just the answer.",
              },
              {
                step: "3",
                icon: <Trophy className="w-6 h-6" />,
                title: "See progress",
                desc: "After each session, see what improved. Parents get a full breakdown.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary-foreground">
                  {item.icon}
                </div>
                <div className="text-sm font-bold text-primary mb-2">Step {item.step}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <Heart className="w-12 h-12 text-destructive mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
              Give your child the confidence to love math
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Free to start. No credit card required. See real progress in the first week.
            </p>
            <a href={getLoginUrl()} className="no-underline">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg px-10 py-6 rounded-2xl shadow-lg shadow-accent/25">
                <Zap className="w-5 h-5 mr-2" />
                Start Free Today
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-foreground/5 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663117001051/BAbKuMSfjHaa9ao8qByqEp/mathfuel-logo-V7jjfN52dexxQobYgXDFCk.webp"
              alt="MathFuel"
              className="w-8 h-8"
            />
            <span className="font-bold text-foreground" style={{ fontFamily: "'Chango', sans-serif" }}>
              Math<span className="text-accent">Fuel</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Adaptive math practice for young learners.
          </p>
        </div>
      </footer>
    </div>
  );
}
