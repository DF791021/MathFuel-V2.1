import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function PaymentFailure() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <div className="container py-12">
        <Card className="max-w-2xl mx-auto border-red-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-600" />
            </div>
            <CardTitle className="text-3xl text-red-900">Payment Cancelled</CardTitle>
            <CardDescription className="text-lg mt-2">
              Your payment was not processed
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-900 mb-2">What Happened?</h3>
              <p className="text-gray-700">
                Your payment was cancelled or did not complete. Your subscription was not activated, and you were not charged.
              </p>
            </div>

            {/* Next Steps */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">What You Can Do:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span>Return to pricing and try again with a different payment method</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span>Contact our sales team for assistance or to discuss payment options</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span>Continue using your free trial (if still active)</span>
                </li>
              </ul>
            </div>

            {/* Troubleshooting */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Common Issues:</h3>
              <ul className="space-y-2 text-sm text-blue-900">
                <li>• <span className="font-semibold">Declined card:</span> Your card was declined. Try a different card or contact your bank.</li>
                <li>• <span className="font-semibold">Incorrect information:</span> Double-check your billing address and zip code.</li>
                <li>• <span className="font-semibold">Browser issue:</span> Try again in a different browser or clear your cache.</li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-4">
                Need help? Our sales team is ready to assist you.
              </p>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-semibold">Email:</span>{" "}
                  <a href="mailto:sales@wisconsinfoodexplorer.com" className="text-green-600 hover:underline">
                    sales@wisconsinfoodexplorer.com
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
                onClick={() => setLocation("/pricing")}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Try Again
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
