import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

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

      // Open checkout in new tab
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
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="container py-12 text-center">
        <h1 className="text-4xl font-bold text-green-900 mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-gray-600 mb-8">
          Choose the plan that's right for your school or district
        </p>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <span className={billingInterval === "month" ? "font-semibold text-green-900" : "text-gray-600"}>
            Monthly
          </span>
          <button
            onClick={() => setBillingInterval(billingInterval === "month" ? "year" : "month")}
            className="relative inline-flex h-8 w-14 items-center rounded-full bg-gray-300"
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                billingInterval === "year" ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
          <span className={billingInterval === "year" ? "font-semibold text-green-900" : "text-gray-600"}>
            Annual
          </span>
          {billingInterval === "year" && (
            <Badge className="bg-green-600 ml-2">Save 2 months!</Badge>
          )}
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="container mb-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* School License */}
          <Card className="relative border-2 border-gray-200 hover:border-green-500 transition">
            <CardHeader>
              <CardTitle className="text-2xl text-green-900">{pricing.school.name}</CardTitle>
              <CardDescription>{pricing.school.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price */}
              <div>
                <div className="text-4xl font-bold text-green-900">
                  {schoolPricing.formatted}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Billed {billingInterval === "month" ? "monthly" : "annually"}
                </p>
                {billingInterval === "year" && (
                  <p className="text-sm text-green-600 font-semibold mt-1">
                    Save {pricing.school.pricing.annual.savings} annually
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectTier("school")}
                disabled={isLoading && selectedTier === "school"}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading && selectedTier === "school" ? "Processing..." : "Get Started"}
              </Button>

              {/* Features */}
              <div className="space-y-3 pt-6 border-t">
                {pricing.school.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* District License */}
          <Card className="relative border-2 border-green-500 shadow-lg">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-green-600">Most Popular</Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl text-green-900">{pricing.district.name}</CardTitle>
              <CardDescription>{pricing.district.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Price */}
              <div>
                <div className="text-4xl font-bold text-green-900">
                  {districtPricing.formatted}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Billed {billingInterval === "month" ? "monthly" : "annually"}
                </p>
                {billingInterval === "year" && (
                  <p className="text-sm text-green-600 font-semibold mt-1">
                    Save {pricing.district.pricing.annual.savings} annually
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <Button
                onClick={() => handleSelectTier("district")}
                disabled={isLoading && selectedTier === "district"}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading && selectedTier === "district" ? "Processing..." : "Get Started"}
              </Button>

              {/* Features */}
              <div className="space-y-3 pt-6 border-t">
                {pricing.district.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16 border-t">
        <div className="container max-w-3xl">
          <h2 className="text-3xl font-bold text-green-900 mb-12 text-center">Frequently Asked Questions</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Can I switch plans later?</h3>
              <p className="text-gray-700">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-700">
                We accept all major credit cards (Visa, Mastercard, American Express) and can discuss other payment options for large district orders.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Is there a discount for multi-year commitments?</h3>
              <p className="text-gray-700">
                Yes! We offer special pricing for 2-year and 3-year commitments. Contact our sales team for details.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">Do you offer educational discounts?</h3>
              <p className="text-gray-700">
                Absolutely. All public and private schools qualify for our educational pricing. Contact sales@wisconsinfoodexplorer.com for more information.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">What happens after my trial ends?</h3>
              <p className="text-gray-700">
                Your trial account will transition to read-only mode. You can convert to a paid plan at any time to regain full access.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-green-900 text-white py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Nutrition Education?</h2>
          <p className="text-lg mb-8 text-green-100">
            Start your free 30-day trial today. No credit card required.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-white text-green-900 hover:bg-gray-100"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
}
