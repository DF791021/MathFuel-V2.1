import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Loader } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const sessionId = new URLSearchParams(search).get("session_id");
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);

  const { data: session } = trpc.payment.getCheckoutSession.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!sessionId }
  );

  useEffect(() => {
    if (session) {
      setSessionData(session);
      setIsLoading(false);
    }
  }, [session]);

  if (!sessionId) {
    return (
      <div className="container py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Invalid Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Could not find your payment session. Please try again.</p>
            <Button onClick={() => setLocation("/pricing")} className="w-full">
              Return to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto border-green-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <CardTitle className="text-3xl text-green-900">Payment Successful!</CardTitle>
            <CardDescription className="text-lg mt-2">
              Welcome to Wisconsin Food Explorer
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Confirmation Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="font-semibold text-green-900 mb-2">Your subscription is now active</h3>
              <p className="text-gray-700">
                You now have full access to all features of Wisconsin Food Explorer. Your subscription will renew on{" "}
                <span className="font-semibold">
                  {sessionData?.nextBillingDate
                    ? new Date(sessionData.nextBillingDate).toLocaleDateString()
                    : "your renewal date"}
                </span>
                .
              </p>
            </div>

            {/* What's Next */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">What's Next?</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-0.5">1.</span>
                  <span>Check your email for your subscription confirmation and receipt</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-0.5">2.</span>
                  <span>Download our Getting Started guide to maximize your platform</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-0.5">3.</span>
                  <span>Schedule a free onboarding session with our team</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 font-bold mt-0.5">4.</span>
                  <span>Start creating classes and engaging your students</span>
                </li>
              </ul>
            </div>

            {/* Key Features */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="font-semibold text-amber-900 mb-3">You Now Have Access To:</h3>
              <ul className="grid md:grid-cols-2 gap-2 text-sm text-amber-900">
                <li>✓ 60+ Challenge Cards</li>
                <li>✓ Nutrition Roulette Game</li>
                <li>✓ Full Teacher Portal</li>
                <li>✓ Custom Questions</li>
                <li>✓ Email Templates</li>
                <li>✓ Analytics Dashboard</li>
                <li>✓ Certificate Generation</li>
                <li>✓ Priority Support</li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Have questions? Our support team is here to help!
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  <a href="mailto:support@wisconsinfoodexplorer.com" className="text-green-600 hover:underline">
                    support@wisconsinfoodexplorer.com
                  </a>
                </p>
                <p>
                  <span className="font-semibold">Phone:</span>{" "}
                  <a href="tel:1-800-947-3663" className="text-green-600 hover:underline">
                    1-800-WIS-FOOD
                  </a>
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button
                onClick={() => setLocation("/teachers")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Go to Teacher Portal
              </Button>
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="flex-1"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
