import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Rocket, ArrowRight, Sparkles } from "lucide-react";

const LOGO_URL = import.meta.env.VITE_APP_LOGO || "";

export default function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Welcome back!");
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Login failed. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex flex-col">
      {/* Floating math symbols background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        {["÷", "×", "+", "−", "=", "π", "∞", "%"].map((s, i) => (
          <motion.span
            key={i}
            className="absolute text-6xl sm:text-8xl font-bold text-indigo-900"
            style={{
              top: `${10 + (i * 12) % 80}%`,
              left: `${5 + (i * 15) % 90}%`,
            }}
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
            transition={{
              duration: 6 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {s}
          </motion.span>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 py-4 sm:py-6">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {LOGO_URL ? (
            <img src={LOGO_URL} alt="MathFuel" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg" />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
          )}
          <span className="text-lg sm:text-xl font-bold text-indigo-900">MathFuel</span>
        </button>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Welcome text */}
          <div className="text-center mb-6 sm:mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 15 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs sm:text-sm font-medium mb-3"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Welcome back, learner!
            </motion.div>
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-1.5">
              Log in to MathFuel
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Continue your math adventure
            </p>
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-xl shadow-indigo-100/50 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-5 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 sm:h-12 text-sm sm:text-base"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-11 sm:h-12 text-sm sm:text-base pr-11"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold gap-2"
                >
                  {loginMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <>
                      Log In
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sign up link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-5 sm:mt-6"
          >
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors underline underline-offset-2"
              >
                Sign up free
              </button>
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
