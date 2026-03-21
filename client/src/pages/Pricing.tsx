import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import {
  Check, Zap, Crown, Sparkles, ArrowLeft, Loader2, X,
} from "lucide-react";
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
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to start checkout. Please try again.");
    },
  });

  useEffect(() => {
    document.title = "Pricing - MathFuel";
  }, []);

  // Show canceled toast
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

  const freePlan = plans?.free;
  const familyPlan = plans?.family;

  const monthlyPrice = familyPlan ? (familyPlan.priceMonthly / 100).toFixed(2) : "7.99";
  const yearlyPrice = familyPlan ? (familyPlan.priceYearly / 100).toFixed(2) : "59.99";
  const yearlyMonthly = familyPlan
    ? (familyPlan.priceYearly / 100 / 12).toFixed(2)
    : "5.00";
  const savingsPercent = familyPlan
    ? Math.round(
        (1 - familyPlan.priceYearly / (familyPlan.priceMonthly * 12)) * 100
      )
    : 37;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-amber-50/30">
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
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="pt-10 sm:pt-16 pb-8 sm:pb-12 px-4 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="inline-flex items-center gap-2 bg-accent/15 text-accent-foreground px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Simple, Fair Pricing
          </div>
        </motion.div>

        <motion.h1
          initial="hidden" animate="visible" variants={fadeUp} custom={1}
          className="!text-3xl sm:!text-5xl font-extrabold text-foreground !leading-tight mb-3 sm:mb-4"
        >
          Invest in your child's{" "}
          <span className="text-primary">math confidence</span>
        </motion.h1>

        <motion.p
          initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-8"
        >
          Start free. Upgrade when you're ready for unlimited practice and full parent insights.
        </motion.p>

        {/* Interval Toggle */}
        <motion.div
          initial="hidden" animate="visible" variants={fadeUp} custom={3}
          className="inline-flex items-center bg-muted rounded-full p-1 mb-8"
        >
          <button
            onClick={() => setInterval("monthly")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              interval === "monthly"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
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
      <section className="px-4 pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Free Plan */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
            <Card className={`h-full border-2 ${
              !isCurrentlySubscribed ? "border-primary/30 shadow-lg" : "border-border"
            } bg-white`}>
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">Free</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Get started</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span className="text-3xl sm:text-4xl font-extrabold text-foreground">$0</span>
                  <span className="text-muted-foreground text-sm ml-1">/month</span>
                </div>

                {!isCurrentlySubscribed && !isAuthenticated ? (
                  <Link href="/signup" className="no-underline block mb-6">
                    <Button variant="outline" className="w-full" size="lg">
                      Get Started Free
                    </Button>
                  </Link>
                ) : !isCurrentlySubscribed ? (
                  <div className="mb-6">
                    <Button variant="outline" className="w-full" size="lg" disabled>
                      <Check className="w-4 h-4 mr-2" /> Current Plan
                    </Button>
                  </div>
                ) : (
                  <div className="mb-6">
                    <Button variant="outline" className="w-full" size="lg" disabled>
                      Free Tier
                    </Button>
                  </div>
                )}

                <ul className="space-y-3">
                  {(freePlan?.features || [
                    "5 practice sessions per day",
                    "Basic progress tracking",
                    "7 math skill areas",
                    "Streaks & badges",
                  ]).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Family Plan */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}>
            <Card className={`h-full border-2 relative overflow-hidden ${
              isCurrentlySubscribed ? "border-accent shadow-lg" : "border-accent/50 shadow-xl shadow-accent/10"
            } bg-white`}>
              {/* Popular badge */}
              <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] sm:text-xs font-bold px-3 py-1 rounded-bl-lg">
                MOST POPULAR
              </div>

              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-accent/15 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">Family</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">Unlimited learning</p>
                  </div>
                </div>

                <div className="mb-6">
                  {interval === "yearly" ? (
                    <>
                      <span className="text-3xl sm:text-4xl font-extrabold text-foreground">
                        ${yearlyMonthly}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">/month</span>
                      <div className="text-xs text-muted-foreground mt-1">
                        ${yearlyPrice} billed annually
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl sm:text-4xl font-extrabold text-foreground">
                        ${monthlyPrice}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">/month</span>
                    </>
                  )}
                </div>

                {isCurrentlySubscribed ? (
                  <div className="mb-6">
                    <Button className="w-full bg-accent text-accent-foreground" size="lg" disabled>
                      <Crown className="w-4 h-4 mr-2" /> Current Plan
                    </Button>
                  </div>
                ) : (
                  <div className="mb-6">
                    <Button
                      className="w-full bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25"
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
                  </div>
                )}

                <ul className="space-y-3">
                  {(familyPlan?.features || [
                    "Unlimited practice sessions",
                    "Unlimited AI hints & explanations",
                    "Full parent dashboard",
                    "Detailed mastery reports",
                    "Priority support",
                    "Up to 4 student accounts",
                  ]).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                      <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <span className="font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* FAQ / Trust */}
        <div className="max-w-2xl mx-auto mt-12 sm:mt-16 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h3>
          </motion.div>

          <div className="space-y-4 text-left">
            {[
              {
                q: "Can I try it before paying?",
                a: "The Free plan is always available with 5 sessions per day. No credit card needed to start.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes! Cancel anytime from your account settings. You'll keep access until the end of your billing period.",
              },
              {
                q: "What ages is MathFuel for?",
                a: "MathFuel is designed for Grade 1-2 students (ages 5-8). All content is aligned with elementary math standards.",
              },
              {
                q: "Can multiple kids use one Family plan?",
                a: "Yes! The Family plan supports up to 4 student accounts, each with their own progress tracking.",
              },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
              >
                <Card className="border-0 shadow-sm bg-white">
                  <CardContent className="p-4 sm:p-5">
                    <h4 className="font-bold text-foreground mb-1.5 text-sm sm:text-base">{faq.q}</h4>
                    <p className="text-sm text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground/5 py-6 px-4 safe-bottom">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="MathFuel" className="w-7 h-7" />
            <span className="font-bold text-foreground text-sm" style={{ fontFamily: "'Chango', sans-serif" }}>
              Math<span className="text-accent">Fuel</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Secure payments powered by Stripe. Cancel anytime.
          </p>
        </div>
      </footer>
    </div>
  );
}
