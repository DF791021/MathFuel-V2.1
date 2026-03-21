import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const forgotMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSent(true);
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    forgotMutation.mutate({ email: email.trim() });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Back to login */}
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <Card className="border-0 shadow-xl shadow-indigo-100/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-gray-900">
              {sent ? "Check your email" : "Forgot password?"}
            </CardTitle>
            <CardDescription className="text-base mt-1">
              {sent
                ? "We've sent a password reset link to your email."
                : "No worries! Enter your email and we'll send you a reset link."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {sent ? (
              <div className="space-y-6">
                {/* Success state */}
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      We sent a reset link to
                    </p>
                    <p className="font-semibold text-gray-900 break-all">{email}</p>
                    <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                      The link expires in 1 hour. Check your spam folder if you don't see it.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => {
                      setSent(false);
                      setEmail("");
                    }}
                  >
                    Try a different email
                  </Button>
                  <Link href="/login">
                    <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                      Return to login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 bg-gray-50/50 border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                    autoFocus
                    required
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base"
                  disabled={forgotMutation.isPending}
                >
                  {forgotMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
