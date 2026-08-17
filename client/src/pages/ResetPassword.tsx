import { useState, useMemo } from "react";
import { Link, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Lock, CircleCheck as CheckCircle2, Circle as XCircle, Loader as Loader2, Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const search = useSearch();
  const token = useMemo(() => new URLSearchParams(search).get("token") || "", [search]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Verify token is valid
  const tokenQuery = trpc.auth.verifyResetToken.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );
  const isInvitation = tokenQuery.data?.purpose === "invite";

  const resetMutation = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setError("");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Passwords need 6 or more characters. Add a few more.");
      return;
    }
    if (password !== confirmPassword) {
      setError("These two passwords are different. Check for typos.");
      return;
    }

    resetMutation.mutate({ token, newPassword: password });
  }

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-0 shadow-xl shadow-indigo-100/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">This link isn't valid</h2>
              <p className="text-sm text-muted-foreground">
                The reset link is missing or incomplete. Request a fresh one to continue.
              </p>
              <Link href="/forgot-password">
                <Button className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  Request new link
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading token verification
  if (tokenQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Token is invalid or expired
  if (tokenQuery.data && !tokenQuery.data.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-0 shadow-xl shadow-indigo-100/50 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">This link has expired</h2>
              <p className="text-sm text-muted-foreground">
                {isInvitation ? "Invitation links work for 48 hours and can only be used once. Ask your administrator to resend the invitation." : "Reset links only work for 1 hour and can only be used once. Request a new one to continue."}
              </p>
              <Link href="/forgot-password">
                <Button className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                  Request new link
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <Card className="border-0 shadow-xl shadow-indigo-100/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-gray-900">
              {success ? "Password created" : isInvitation ? "Create your MathFuel password" : "Create a new password"}
            </CardTitle>
            <CardDescription className="text-base mt-1">
              {success
                ? "You're all set. Log in with your assigned email address and your new password."
                : "Pick something strong you'll remember."}
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4">
            {success ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Log in with your new password to continue.
                  </p>
                </div>
                <Link href="/login">
                  <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                    Go to login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="6 or more characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 bg-gray-50/50 border-gray-200 focus:border-indigo-400 focus:ring-indigo-400 pr-10"
                      autoFocus
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm new password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Retype the password above"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 bg-gray-50/50 border-gray-200 focus:border-indigo-400 focus:ring-indigo-400"
                    required
                    minLength={6}
                  />
                </div>

                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            password.length >= level * 3
                              ? password.length >= 12
                                ? "bg-emerald-400"
                                : password.length >= 8
                                ? "bg-amber-400"
                                : "bg-red-400"
                              : "bg-gray-100"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {password.length < 6
                        ? "Too short"
                        : password.length < 8
                        ? "Fair"
                        : password.length < 12
                        ? "Good"
                        : "Strong"}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base"
                  disabled={resetMutation.isPending}
                >
                  {resetMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving your new password...
                    </>
                  ) : (
                    "Save new password"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
