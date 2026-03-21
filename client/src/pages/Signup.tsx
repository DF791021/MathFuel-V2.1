import { useState, useEffect, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Rocket,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Users,
  CheckCircle2,
  Sparkles,
  Gift,
} from "lucide-react";

const LOGO_URL = import.meta.env.VITE_APP_LOGO || "";

type UserType = "student" | "parent" | "teacher";
type Step = "role" | "details";

const ROLE_OPTIONS: {
  value: UserType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    value: "student",
    label: "I'm a Student",
    description: "I want to practice math and level up my skills",
    icon: <Rocket className="w-6 h-6" />,
    color: "bg-indigo-50 border-indigo-200 hover:border-indigo-400 text-indigo-700",
  },
  {
    value: "parent",
    label: "I'm a Parent",
    description: "I want to track my child's progress and support their learning",
    icon: <Users className="w-6 h-6" />,
    color: "bg-teal-50 border-teal-200 hover:border-teal-400 text-teal-700",
  },
  {
    value: "teacher",
    label: "I'm a Teacher",
    description: "I want to use MathFuel with my classroom",
    icon: <GraduationCap className="w-6 h-6" />,
    color: "bg-amber-50 border-amber-200 hover:border-amber-400 text-amber-700",
  },
];

const GRADE_OPTIONS = [
  { value: 1, label: "Grade 1" },
  { value: 2, label: "Grade 2" },
  { value: 3, label: "Grade 3" },
  { value: 4, label: "Grade 4" },
  { value: 5, label: "Grade 5" },
];

export default function Signup() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const [step, setStep] = useState<Step>("role");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [gradeLevel, setGradeLevel] = useState<number | null>(null);

  // Extract referral code from URL (?ref=CODE)
  const referralCode = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get("ref") || "";
  }, [searchString]);

  // Validate the referral code if present
  const referralValidation = trpc.referral.validateCode.useQuery(
    { code: referralCode },
    { enabled: referralCode.length > 0 }
  );

  const recordReferralMutation = trpc.referral.recordReferral.useMutation();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      // If there's a valid referral code, record the referral
      if (referralCode && referralValidation.data?.valid) {
        recordReferralMutation.mutate(
          { code: referralCode },
          {
            onSuccess: () => {
              toast.success("Account created! Your referral has been recorded. 🎉");
            },
            onError: () => {
              // Still navigate even if referral recording fails
              toast.success("Account created! Welcome to MathFuel! 🚀");
            },
            onSettled: () => {
              navigate("/dashboard");
            },
          }
        );
      } else {
        toast.success("Account created! Welcome to MathFuel! 🚀");
        navigate("/dashboard");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed. Please try again.");
    },
  });

  const handleRoleSelect = (role: UserType) => {
    setUserType(role);
    setStep("details");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userType || !name.trim() || !email.trim() || !password.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    registerMutation.mutate({
      email: email.trim(),
      password,
      name: name.trim(),
      userType,
      gradeLevel: userType === "student" && gradeLevel ? gradeLevel : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-teal-50 flex flex-col">
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
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
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

      {/* Referral banner */}
      {referralCode && referralValidation.data?.valid && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-4 sm:mx-auto sm:max-w-md mb-4"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
            <div className="shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <Gift className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Referred by {referralValidation.data.referrerName}!
              </p>
              <p className="text-xs text-amber-600">
                Sign up and subscribe to earn them a free month
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pb-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === "role" ? (
              <motion.div
                key="role"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 1: Role Selection */}
                <div className="text-center mb-6 sm:mb-8">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", damping: 15 }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-xs sm:text-sm font-medium mb-3"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Join the adventure!
                  </motion.div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-1.5">
                    Create your account
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    First, tell us who you are
                  </p>
                </div>

                <div className="space-y-3">
                  {ROLE_OPTIONS.map((role, i) => (
                    <motion.button
                      key={role.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      onClick={() => handleRoleSelect(role.value)}
                      className={`w-full p-4 sm:p-5 rounded-xl border-2 transition-all text-left flex items-start gap-3.5 ${role.color}`}
                    >
                      <div className="mt-0.5 shrink-0">{role.icon}</div>
                      <div>
                        <div className="font-semibold text-sm sm:text-base">
                          {role.label}
                        </div>
                        <div className="text-xs sm:text-sm opacity-75 mt-0.5">
                          {role.description}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 ml-auto mt-1 shrink-0 opacity-50" />
                    </motion.button>
                  ))}
                </div>

                {/* Login link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center mt-6"
                >
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <button
                      onClick={() => navigate("/login")}
                      className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors underline underline-offset-2"
                    >
                      Log in
                    </button>
                  </p>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Step 2: Details */}
                <div className="text-center mb-6 sm:mb-8">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-medium mb-3">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {ROLE_OPTIONS.find((r) => r.value === userType)?.label}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-indigo-900 mb-1.5">
                    Almost there!
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Fill in your details to get started
                  </p>
                </div>

                <Card className="border-0 shadow-xl shadow-indigo-100/50 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-5 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm font-medium">
                          {userType === "student" ? "Your name" : "Full name"}
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={
                            userType === "student"
                              ? "What should we call you?"
                              : "Enter your full name"
                          }
                          className="h-11 sm:h-12 text-sm sm:text-base"
                          autoComplete="name"
                          autoFocus
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm font-medium">
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
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="h-11 sm:h-12 text-sm sm:text-base pr-11"
                            autoComplete="new-password"
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
                        {password.length > 0 && password.length < 6 && (
                          <p className="text-xs text-red-500 mt-1">
                            Password must be at least 6 characters
                          </p>
                        )}
                      </div>

                      {/* Grade Level (students only) */}
                      {userType === "student" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="space-y-1.5"
                        >
                          <Label className="text-sm font-medium">
                            What grade are you in?
                          </Label>
                          <div className="flex flex-wrap gap-2">
                            {GRADE_OPTIONS.map((g) => (
                              <button
                                key={g.value}
                                type="button"
                                onClick={() => setGradeLevel(g.value)}
                                className={`px-3.5 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                                  gradeLevel === g.value
                                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                                }`}
                              >
                                {g.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Submit */}
                      <Button
                        type="submit"
                        disabled={registerMutation.isPending}
                        className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold gap-2"
                      >
                        {registerMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <>
                            Create Account
                            <Rocket className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                {/* Back button */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mt-5"
                >
                  <button
                    onClick={() => setStep("role")}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Choose a different role
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
