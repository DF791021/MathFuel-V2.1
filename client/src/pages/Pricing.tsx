import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Sparkles, ArrowLeft, Loader as Loader2, X, Brain, ChartBar as BarChart3, Shield, Users, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663117001051/BAbKuMSfjHaa9ao8qByqEp/mathfuel-logo-V7jjfN52dexxQobYgXDFCk.webp";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

const FREE_FEATURES = [
  { text: "5 practice sessions per day", included: true },
  { text: "3 AI hints per day", included: true },
  { text: "Basic progress tracking", included: true },
  { text: "Streaks & achievement badges", included: true },
  { text: "Full parent dashboard", included: false },
  { text: "Unlimited AI explanations", included: false },
  { text: "Adaptive sequencing engine", included: false },
  { text: "Up to 4 student accounts", included: false },
];

const FAMILY_FEATURES = [
  { text: "Unlimited practice sessions", included: true },
  { text: "Unlimited AI hints & explanations", included: true },
  { text: "Full parent dashboard with insights", included: true },
  { text: "Streaks & achievement badges", included: true },
  { text: "Detailed mastery reports", included: true },
  { text: "Adaptive sequencing engine", included: true },
  { text: "Error pattern identification", included: true },
  { text: "Up to 4 student accounts", included: true },
];

const TRUST_ITEMS = [
  {
    icon: Brain,
    title: "Adaptive Learning",
    desc: "Problems adjust in real time to your child's level — not too easy, not too hard.",
  },
  {
    icon: BarChart3,
    title: "Parent Insights",
    desc: "See exactly where your child excels and where they need help, every week.",
  },
  {
    icon: Shield,
    title: "Safe & Private",
    desc: "No ads, no third-party trackers. Your child's data is never sold.",
  },
  {
    icon: TrendingUp,
    title: "Proven Progress",
    desc: "Students who practice 3× per week see measurable improvement in 30 days.",
  },
];

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");

  const { data: plans } = trpc.payment.getPlans.useQuery();
  const { data: subscription } = trpc.payment.getSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createCheckout = trpc.payment.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
    },
  });

  useEffect(() => {
    document.title = "Pricing - MathFuel";
  }, []);

  useEffect(() => {
    if (searchString?.includes("canceled=true")) {
      toast.info("Checkout was canceled. No charges were made.");
    }
  }, [searchString]);

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      navigate("/signup");
      return;
    }
    createCheckout.mutate({ interval });
  };

  const isCurrentlySubscribed = subscription?.plan === "family";

  const familyPlan = plans?.family;
  const monthlyPrice = familyPlan ? (familyPlan.priceMonthly / 100).toFixed(2) : "7.99";
  const yearlyPrice = familyPlan ? (familyPlan.priceYearly / 100).toFixed(2) : "59.99";
  const yearlyMonthly = familyPlan
    ? (familyPlan.priceYearly / 100 / 12).toFixed(2)
    : "5.00";
  const savingsPercent = familyPlan
    ? Math.round((1 - familyPlan.priceYearly / (familyPlan.priceMonthly * 12)) * 100)
    : 37;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-amber-50/20">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <img src={LOGO_URL} alt="MathFuel" className="w-8 h-8 sm:w-10 sm:h-10" />
            <span
              className="text-xl sm:text-2xl font-extrabold text-foreground"
              style={{ fontFamily: "'Chango', sans-serif" }}
            >
              Math<span className="text-accent">Fuel</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard" className="no-underline">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="no-underline">
                  <Button variant="outline" size="sm">Log In</Button>
                </Link>
                <Link href="/signup" className="no-underline">
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                    Sign Up Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-12 sm:pt-20 pb-10 sm:pb-14 px-4 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Simple, transparent pricing
          </div>
        </motion.div>

        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="!text-3xl sm:!text-5xl font-extrabold text-foreground !leading-tight mb-3 sm:mb-4"
        >
          Give your child the edge in{" "}
          <span className="text-primary">math</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8"
        >
          Start free with no credit card. Upgrade anytime for unlimited practice and real parent insights.
        </motion.p>

        {/* Billing toggle */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={3}
          className="inline-flex items-center bg-muted rounded-full p-1 mb-10"
        >
          <button
            onClick={() => setInterval("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              interval === "monthly"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
              interval === "yearly"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly
            <span className="bg-green-100 text-green-700 text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full font-bold">
              Save {savingsPercent}%
            </span>
          </button>
        </motion.div>
      </section>

      {/* Plan Cards */}
      <section className="px-4 pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">

          {/* Free Plan */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="flex">
            <Card className="flex-1 border-2 border-border bg-white">
              <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Free</h3>
                    <p className="text-sm text-muted-foreground">Get started today</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-foreground">$0</span>
                  <span className="text-muted-foreground text-sm ml-1">/month</span>
                  <p className="text-xs text-muted-foreground mt-1">No credit card required</p>
                </div>

                <div className="mb-6">
                  {!isAuthenticated ? (
                    <Link href="/signup" className="no-underline block">
                      <Button variant="outline" className="w-full" size="lg">
                        Get Started Free
                      </Button>
                    </Link>
                  ) : !isCurrentlySubscribed ? (
                    <Button variant="outline" className="w-full" size="lg" disabled>
                      <Check className="w-4 h-4 mr-2" /> Current Plan
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full" size="lg" disabled>
                      Free Plan
                    </Button>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1">
                  {FREE_FEATURES.map((f, i) => (
                    <li key={i} className={`flex items-start gap-2.5 text-sm ${f.included ? "text-foreground" : "text-muted-foreground/50"}`}>
                      {f.included
                        ? <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        : <X className="w-4 h-4 mt-0.5 shrink-0" />
                      }
                      {f.text}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Family Plan */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5} className="flex">
            <Card className={`flex-1 border-2 relative overflow-hidden ${
              isCurrentlySubscribed ? "border-accent" : "border-accent/70"
            } bg-white shadow-xl shadow-accent/8`}>
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-amber-400 to-accent" />
              <div className="absolute top-3 right-4 bg-accent text-accent-foreground text-[10px] font-bold px-2.5 py-1 rounded-full">
                MOST POPULAR
              </div>

              <CardContent className="p-6 sm:p-8 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4 mt-1">
                  <div className="w-11 h-11 bg-accent/15 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Family</h3>
                    <p className="text-sm text-muted-foreground">Unlimited learning</p>
                  </div>
                </div>

                <div className="mb-6">
                  {interval === "yearly" ? (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold text-foreground">${yearlyMonthly}</span>
                        <span className="text-muted-foreground text-sm">/month</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        ${yearlyPrice} billed annually
                        <span className="ml-1.5 text-green-600 font-semibold">Save {savingsPercent}%</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-extrabold text-foreground">${monthlyPrice}</span>
                        <span className="text-muted-foreground text-sm">/month</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Billed monthly · Cancel anytime</p>
                    </>
                  )}
                </div>

                <div className="mb-6">
                  {isCurrentlySubscribed ? (
                    <Button className="w-full bg-accent text-accent-foreground" size="lg" disabled>
                      <Crown className="w-4 h-4 mr-2" /> Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
                      size="lg"
                      onClick={handleSubscribe}
                      disabled={createCheckout.isPending}
                    >
                      {createCheckout.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      {isAuthenticated ? "Upgrade Now" : "Start Free Trial"}
                    </Button>
                  )}
                </div>

                <ul className="space-y-2.5 flex-1">
                  {FAMILY_FEATURES.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <span className="font-medium">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Why MathFuel */}
      <section className="px-4 pb-16 sm:pb-24 bg-white border-y border-border/40">
        <div className="max-w-5xl mx-auto py-12 sm:py-16">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
              Why families choose MathFuel
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base">
              Not just another worksheet app. MathFuel is a full adaptive learning engine built for lasting confidence.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {TRUST_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1}
              >
                <div className="p-5 rounded-2xl border border-border/60 bg-white hover:shadow-md transition-shadow h-full">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h4 className="font-bold text-foreground text-sm sm:text-base mb-1.5">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-2">
              Questions? Answered.
            </h2>
          </motion.div>

          <div className="space-y-3 sm:space-y-4">
            {[
              {
                q: "Can I try it before paying?",
                a: "Absolutely. The Free plan gives 5 sessions per day with no credit card required. Upgrade only when you're ready.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes — cancel any time from your account settings. You'll keep full access through the end of your billing period.",
              },
              {
                q: "What ages is MathFuel designed for?",
                a: "MathFuel currently focuses on Grade 1–2 students (ages 5–8), with content aligned to elementary math standards.",
              },
              {
                q: "Can multiple kids use one Family plan?",
                a: "Yes! The Family plan supports up to 4 student accounts, each with their own progress, streaks, and mastery tracking.",
              },
              {
                q: "Do parents need their own account?",
                a: "Yes. Parents create a separate account and link to their child using a 6-character invite code generated by the student.",
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i + 1}
              >
                <Card className="border border-border/60 shadow-none bg-white">
                  <CardContent className="p-4 sm:p-5">
                    <h4 className="font-bold text-foreground mb-1.5 text-sm sm:text-base">{faq.q}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section className="px-4 pb-16 sm:pb-24">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          className="max-w-2xl mx-auto text-center bg-gradient-to-br from-primary/8 to-accent/8 rounded-3xl border border-border/50 p-8 sm:p-12"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7 text-accent" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3">
            Ready to fuel their math skills?
          </h2>
          <p className="text-muted-foreground mb-6 text-sm sm:text-base">
            Join families using MathFuel to build real math confidence — one session at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!isAuthenticated ? (
              <>
                <Link href="/signup" className="no-underline">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg w-full sm:w-auto">
                    <Zap className="w-4 h-4 mr-2" /> Start Free — No Card Needed
                  </Button>
                </Link>
              </>
            ) : !isCurrentlySubscribed ? (
              <Button
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg"
                onClick={handleSubscribe}
                disabled={createCheckout.isPending}
              >
                {createCheckout.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Crown className="w-4 h-4 mr-2" />}
                Upgrade to Family
              </Button>
            ) : (
              <Link href="/dashboard" className="no-underline">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Button>
              </Link>
            )}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-6 px-4 safe-bottom">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="MathFuel" className="w-6 h-6" />
            <span className="font-bold text-foreground text-sm" style={{ fontFamily: "'Chango', sans-serif" }}>
              Math<span className="text-accent">Fuel</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Secure payments via Stripe. Cancel anytime. No ads. No data selling.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>SSL encrypted</span>
          </div>
          <p className="text-xs text-muted-foreground/70 text-center">
            &copy; {new Date().getFullYear()} DBB Capital Ventures LLC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
