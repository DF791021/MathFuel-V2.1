import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Brain, Users, BarChart3, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function Pricing() {
  const [billingInterval, setBillingInterval] = useState<"month" | "year">("year");
  const [selectedTier, setSelectedTier] = useState<"school" | "district" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: pricing } = trpc.payment.getPricingInfo.useQuery();
  const createCheckoutMutation = trpc.payment.createCheckoutSession.useMutation();

  const handleSelectTier = async (tier: "school" | "district") => {
    if (!user) {
      setLocation("/");
      return;
    }

    setIsLoading(true);
    setSelectedTier(tier);

    try {
      const result = await createCheckoutMutation.mutateAsync({
        tier,
        billingInterval,
      });

      window.open(result.checkoutUrl, "_blank");
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
      setSelectedTier(null);
    }
  };

  if (!pricing) {
    return <div className="container py-12">Loading pricing information...</div>;
  }

  const schoolPricing = pricing.school.pricing[billingInterval];
  const districtPricing = pricing.district.pricing[billingInterval];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="container py-8 sm:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl sm:text-5xl font-bold text-primary mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8 px-4">
            Choose the plan that's right for your school or district. Start with a free 30-day trial.
          </p>

          {/* Billing Toggle */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
            <span className={`text-sm sm:text-base ${billingInterval === "month" ? "font-semibold text-primary" : "text-gray-600"}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingInterval(billingInterval === "month" ? "year" : "month")}
              className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300 hover:bg-gray-400 transition"
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                  billingInterval === "year" ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`text-sm sm:text-base ${billingInterval === "year" ? "font-semibold text-primary" : "text-gray-600"}`}>
              Annual
            </span>
            {billingInterval === "year" && (
              <Badge className="bg-orange-500 ml-2 text-xs sm:text-sm">Save 2 months!</Badge>
            )}
          </div>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="container mb-16 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {/* School License */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <Card className="relative border-2 border-gray-200 hover:border-primary transition h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl text-primary flex items-center gap-2">
                  <Brain className="h-6 w-6" />
                  {pricing.school.name}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">{pricing.school.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col">
                {/* Price */}
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-primary">
                    {schoolPricing.formatted}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2">
                    per school, {billingInterval === "month" ? "monthly" : "annually"}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 flex-1">
                  {[
                    "Up to 500 students",
                    "Unlimited math topics",
                    "Teacher analytics dashboard",
                    "Parent engagement tools",
                    "Student progress tracking",
                    "Certificate generation",
                    "Email support",
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  onClick={() => handleSelectTier("school")}
                  disabled={isLoading && selectedTier === "school"}
                  className="w-full mt-6"
                  size="lg"
                >
                  {isLoading && selectedTier === "school" ? "Processing..." : "Start Free Trial"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* District License */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="relative border-2 border-primary shadow-lg hover:shadow-xl transition h-full flex flex-col">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-orange-500 text-xs sm:text-sm">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl text-primary flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  {pricing.district.name}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">{pricing.district.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 flex flex-col">
                {/* Price */}
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-primary">
                    {districtPricing.formatted}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2">
                    per district, {billingInterval === "month" ? "monthly" : "annually"}
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 flex-1">
                  {[
                    "Unlimited students",
                    "All math topics & levels",
                    "Advanced analytics",
                    "District-wide reporting",
                    "Custom branding",
                    "Professional development",
                    "Dedicated support",
                    "API access",
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button
                  onClick={() => handleSelectTier("district")}
                  disabled={isLoading && selectedTier === "district"}
                  className="w-full mt-6"
                  size="lg"
                >
                  {isLoading && selectedTier === "district" ? "Processing..." : "Start Free Trial"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="container mb-16 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-primary">
          Detailed Feature Comparison
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-primary">
                <th className="text-left py-4 px-2 sm:px-4 font-semibold text-primary">Feature</th>
                <th className="text-center py-4 px-2 sm:px-4 font-semibold text-primary">School</th>
                <th className="text-center py-4 px-2 sm:px-4 font-semibold text-primary">District</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Math Topics", school: "All", district: "All" },
                { feature: "Grade Levels", school: "K-12", district: "K-12" },
                { feature: "Student Limit", school: "500", district: "Unlimited" },
                { feature: "Teacher Accounts", school: "Unlimited", district: "Unlimited" },
                { feature: "Analytics", school: "Basic", district: "Advanced" },
                { feature: "Custom Branding", school: false, district: true },
                { feature: "API Access", school: false, district: true },
                { feature: "Dedicated Support", school: false, district: true },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50">
                  <td className="py-4 px-2 sm:px-4 font-medium text-gray-700">{row.feature}</td>
                  <td className="py-4 px-2 sm:px-4 text-center">
                    {typeof row.school === "boolean" ? (
                      row.school ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-700">{row.school}</span>
                    )}
                  </td>
                  <td className="py-4 px-2 sm:px-4 text-center">
                    {typeof row.district === "boolean" ? (
                      row.district ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      )
                    ) : (
                      <span className="text-gray-700">{row.district}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mb-16 px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-primary">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              q: "Can I upgrade or downgrade my plan?",
              a: "Yes, you can change your plan at any time. Changes take effect at the next billing cycle.",
            },
            {
              q: "What payment methods do you accept?",
              a: "We accept all major credit cards (Visa, Mastercard, American Express) and bank transfers for district accounts.",
            },
            {
              q: "Is there a setup fee?",
              a: "No, there are no setup fees. You only pay the monthly or annual subscription price.",
            },
            {
              q: "Do you offer discounts for multi-year commitments?",
              a: "Yes, contact our sales team for volume discounts and multi-year pricing options.",
            },
          ].map((faq, idx) => (
            <Card key={idx} className="hover:shadow-md transition">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg text-primary">{faq.q}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-gray-700">{faq.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Footer */}
      <div className="container py-12 sm:py-16 text-center border-t">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-primary">
          Questions? Let's Talk
        </h2>
        <p className="text-base sm:text-lg text-gray-600 mb-8">
          Our team is ready to help you find the perfect plan for your school or district.
        </p>
        <Button size="lg" variant="outline" className="gap-2">
          <span>Schedule a Demo</span>
        </Button>
      </div>
    </div>
  );
}
