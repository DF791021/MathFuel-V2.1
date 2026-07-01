import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ArrowRight, Lock, Briefcase, Rocket } from "lucide-react";

const INVESTOR_PASSWORD = "Mathmatics1021";
const INVESTOR_UNLOCK_KEY = "mathfuel_investor_unlocked";

export default function InvestorGate({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const ok =
        typeof window !== "undefined" &&
        (window.localStorage.getItem(INVESTOR_UNLOCK_KEY) === "true" ||
          window.sessionStorage.getItem(INVESTOR_UNLOCK_KEY) === "true");
      setUnlocked(ok);
    } catch {
      setUnlocked(true);
    }
  }, []);

  if (unlocked === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === INVESTOR_PASSWORD) {
      try {
        window.localStorage.setItem(INVESTOR_UNLOCK_KEY, "true");
        window.sessionStorage.setItem(INVESTOR_UNLOCK_KEY, "true");
      } catch {}
      setUnlocked(true);
      setError("");
    } else {
      setError("That password isn't right. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        {["÷", "×", "+", "−", "=", "π", "∞", "%"].map((s, i) => (
          <motion.span
            key={i}
            className="absolute text-6xl sm:text-8xl font-bold text-blue-900"
            style={{
              top: `${10 + (i * 12) % 80}%`,
              left: `${5 + (i * 15) % 90}%`,
            }}
            animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6 + i, repeat: Infinity, ease: "easeInOut" }}
          >
            {s}
          </motion.span>
        ))}
      </div>

      <header className="relative z-10 px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-600 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-blue-900">MathFuel</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium mb-3">
              <Briefcase className="w-3.5 h-3.5" />
              Private preview
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              For Investor Login Please Enter Password
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              MathFuel is in a closed preview while we finalize onboarding.
            </p>
          </div>

          <Card className="border-0 shadow-xl shadow-blue-100/50 bg-white/85 backdrop-blur-sm">
            <CardContent className="p-5 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="investor-password" className="text-sm font-medium">
                    Access password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="investor-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Enter the investor password"
                      className="h-11 sm:h-12 text-sm sm:text-base pl-10 pr-11"
                      autoFocus
                      autoComplete="off"
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
                  {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold gap-2"
                >
                  Unlock access
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
