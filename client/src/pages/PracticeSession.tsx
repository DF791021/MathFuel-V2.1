import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, XCircle, Lightbulb, ChevronRight,
  Play, Trophy, Sparkles, Clock, Zap, RotateCcw, Home,
} from "lucide-react";
import { toast } from "sonner";

const PROBLEMS_PER_SESSION = 10;

type SessionState = "setup" | "playing" | "feedback" | "complete";
type Problem = {
  id: number;
  skillId: number;
  problemType: string;
  difficulty: number;
  questionText: string;
  questionImage: string | null;
  answerType: string;
  choices: any;
};
type FeedbackData = {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
  hintSteps: any;
  masteryScore: number;
  masteryLevel: string;
  streak: number;
};

export default function PracticeSession() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ skillId?: string }>();
  const skillId = params.skillId ? parseInt(params.skillId) : undefined;

  const [state, setState] = useState<SessionState>("setup");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [hintsViewed, setHintsViewed] = useState(0);
  const [visibleHints, setVisibleHints] = useState<string[]>([]);
  const [problemCount, setProblemCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [sessionResults, setSessionResults] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const gradeLevel = user?.gradeLevel ?? 1;

  useEffect(() => {
    document.title = "Practice - MathFuel";
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  const startSessionMutation = trpc.practice.startSession.useMutation({
    onSuccess: (data) => {
      setSessionId(data.sessionId);
      setState("playing");
      setProblemCount(0);
      setCorrectCount(0);
    },
    onError: (err) => toast.error("Failed to start session: " + err.message),
  });

  const submitAnswerMutation = trpc.practice.submitAnswer.useMutation({
    onSuccess: (data) => {
      setFeedback(data);
      setState("feedback");
      if (data.isCorrect) setCorrectCount((c) => c + 1);
      setIsSubmitting(false);
    },
    onError: (err) => {
      toast.error("Failed to submit answer: " + err.message);
      setIsSubmitting(false);
    },
  });

  const completeSessionMutation = trpc.practice.completeSession.useMutation({
    onSuccess: (data) => {
      setSessionResults(data);
      setState("complete");
    },
    onError: (err) => toast.error("Failed to complete session: " + err.message),
  });

  // Fetch next problem
  const fetchNextProblem = useCallback(async () => {
    if (!sessionId) return;
    try {
      const problem = await utils.client.practice.getNextProblem.query({
        sessionId,
        gradeLevel,
      });
      if (problem) {
        setCurrentProblem(problem);
        setAnswer("");
        setHintsViewed(0);
        setVisibleHints([]);
        setStartTime(Date.now());
        setProblemCount((c) => c + 1);
        setState("playing");
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        // No more problems, complete session
        completeSessionMutation.mutate({ sessionId });
      }
    } catch (err: any) {
      toast.error("Failed to load problem: " + err.message);
    }
  }, [sessionId, gradeLevel, utils, completeSessionMutation]);

  // Start session
  const handleStart = () => {
    startSessionMutation.mutate({
      sessionType: "daily",
      skillIds: skillId ? [skillId] : undefined,
      gradeLevel,
    });
  };

  // Auto-fetch first problem when session starts
  useEffect(() => {
    if (sessionId && state === "playing" && !currentProblem) {
      fetchNextProblem();
    }
  }, [sessionId, state, currentProblem, fetchNextProblem]);

  // Submit answer
  const handleSubmit = () => {
    if (!answer.trim() || !currentProblem || !sessionId || isSubmitting) return;
    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    submitAnswerMutation.mutate({
      sessionId,
      problemId: currentProblem.id,
      answer: answer.trim(),
      timeSpentSeconds: timeSpent,
      hintsViewed,
    });
  };

  // Get hint
  const handleGetHint = async () => {
    if (!currentProblem) return;
    try {
      const result = await utils.client.practice.getHint.query({
        problemId: currentProblem.id,
        hintIndex: hintsViewed,
      });
      if (result.hint) {
        setVisibleHints((prev) => [...prev, result.hint!]);
        setHintsViewed((h) => h + 1);
      } else {
        toast.info("No more hints available!");
      }
    } catch (err: any) {
      toast.error("Failed to get hint");
    }
  };

  // Next problem
  const handleNext = () => {
    if (problemCount >= PROBLEMS_PER_SESSION && sessionId) {
      completeSessionMutation.mutate({ sessionId });
    } else {
      setCurrentProblem(null);
      setFeedback(null);
      fetchNextProblem();
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container flex items-center justify-between h-14">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Button>
          </Link>
          {state === "playing" || state === "feedback" ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {problemCount}/{PROBLEMS_PER_SESSION}
              </span>
              <Progress value={(problemCount / PROBLEMS_PER_SESSION) * 100} className="w-24 h-2" />
              <Badge variant="secondary" className="gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {correctCount}
              </Badge>
            </div>
          ) : null}
        </div>
      </header>

      <main className="container py-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {state === "setup" && (
            <SetupScreen
              key="setup"
              onStart={handleStart}
              isLoading={startSessionMutation.isPending}
              skillId={skillId}
            />
          )}
          {state === "playing" && currentProblem && (
            <ProblemScreen
              key={`problem-${currentProblem.id}`}
              problem={currentProblem}
              answer={answer}
              setAnswer={setAnswer}
              onSubmit={handleSubmit}
              onGetHint={handleGetHint}
              visibleHints={visibleHints}
              hintsViewed={hintsViewed}
              isSubmitting={isSubmitting}
              inputRef={inputRef}
            />
          )}
          {state === "playing" && !currentProblem && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-20"
            >
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
                <p className="text-muted-foreground">Loading next problem...</p>
              </div>
            </motion.div>
          )}
          {state === "feedback" && feedback && currentProblem && (
            <FeedbackScreen
              key="feedback"
              feedback={feedback}
              problem={currentProblem}
              answer={answer}
              onNext={handleNext}
              isLast={problemCount >= PROBLEMS_PER_SESSION}
            />
          )}
          {state === "complete" && sessionResults && (
            <CompleteScreen
              key="complete"
              results={sessionResults}
              onPlayAgain={() => {
                setState("setup");
                setSessionId(null);
                setCurrentProblem(null);
                setFeedback(null);
                setSessionResults(null);
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SetupScreen({ onStart, isLoading, skillId }: {
  onStart: () => void;
  isLoading: boolean;
  skillId?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-8 py-12"
    >
      <div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl mb-6"
        >
          <Zap className="w-12 h-12 text-white" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">Ready to Practice?</h1>
        <p className="text-muted-foreground text-lg">
          {skillId
            ? "Practice this specific skill with adaptive problems."
            : "Answer 10 questions at your level. Problems adapt to you!"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
        <div className="text-center p-3 rounded-xl bg-green-50 border border-green-200">
          <p className="text-2xl font-bold text-green-700">10</p>
          <p className="text-xs text-green-600">Questions</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-200">
          <Lightbulb className="w-6 h-6 mx-auto text-blue-600" />
          <p className="text-xs text-blue-600 mt-1">Hints</p>
        </div>
        <div className="text-center p-3 rounded-xl bg-purple-50 border border-purple-200">
          <Sparkles className="w-6 h-6 mx-auto text-purple-600" />
          <p className="text-xs text-purple-600 mt-1">Adaptive</p>
        </div>
      </div>

      <Button
        size="lg"
        onClick={onStart}
        disabled={isLoading}
        className="text-lg px-10 py-6 shadow-lg gap-2"
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <Play className="w-5 h-5" />
        )}
        {isLoading ? "Starting..." : "Let's Go!"}
      </Button>
    </motion.div>
  );
}

function ProblemScreen({ problem, answer, setAnswer, onSubmit, onGetHint, visibleHints, hintsViewed, isSubmitting, inputRef }: {
  problem: Problem;
  answer: string;
  setAnswer: (v: string) => void;
  onSubmit: () => void;
  onGetHint: () => void;
  visibleHints: string[];
  hintsViewed: number;
  isSubmitting: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const choices = problem.choices ? (typeof problem.choices === "string" ? JSON.parse(problem.choices) : problem.choices) : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Difficulty indicator */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((d) => (
            <div
              key={d}
              className={`w-2 h-2 rounded-full ${d <= problem.difficulty ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        <Badge variant="secondary" className="text-xs">
          {problem.problemType.replace("_", " ")}
        </Badge>
      </div>

      {/* Question */}
      <Card className="border-2">
        <CardContent className="p-6 sm:p-8">
          <p className="text-xl sm:text-2xl font-semibold text-center leading-relaxed">
            {problem.questionText}
          </p>
          {problem.questionImage && (
            <img src={problem.questionImage} alt="Question" className="max-w-xs mx-auto mt-4 rounded-lg" />
          )}
        </CardContent>
      </Card>

      {/* Answer Input */}
      <div className="space-y-4">
        {choices ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(choices as string[]).map((choice: string, i: number) => (
              <Button
                key={i}
                variant={answer === choice ? "default" : "outline"}
                className={`p-4 h-auto text-left text-base justify-start ${
                  answer === choice ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setAnswer(choice)}
              >
                <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {choice}
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              type={problem.answerType === "number" ? "number" : "text"}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
              placeholder="Type your answer..."
              className="text-lg h-14 text-center"
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={onSubmit}
            disabled={!answer.trim() || isSubmitting}
            className="flex-1 h-12 text-lg gap-2"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            {isSubmitting ? "Checking..." : "Submit"}
          </Button>
          <Button
            variant="outline"
            onClick={onGetHint}
            className="h-12 gap-2"
          >
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            Hint
          </Button>
        </div>
      </div>

      {/* Hints */}
      <AnimatePresence>
        {visibleHints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            {visibleHints.map((hint, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="flex gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200"
              >
                <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">{hint}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FeedbackScreen({ feedback, problem, answer, onNext, isLast }: {
  feedback: FeedbackData;
  problem: Problem;
  answer: string;
  onNext: () => void;
  isLast: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-6"
    >
      {/* Result Banner */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 10 }}
      >
        <Card className={`border-2 ${feedback.isCorrect ? "border-green-300 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <CardContent className="p-6 text-center">
            <motion.div
              initial={{ rotate: -10, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              {feedback.isCorrect ? (
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
              ) : (
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-3" />
              )}
            </motion.div>
            <h2 className={`text-2xl font-bold ${feedback.isCorrect ? "text-green-700" : "text-red-700"}`}>
              {feedback.isCorrect ? "Correct!" : "Not Quite!"}
            </h2>
            {feedback.isCorrect && feedback.streak > 1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-green-600 mt-1"
              >
                🔥 {feedback.streak} in a row!
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Answer Details */}
      {!feedback.isCorrect && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your answer:</span>
              <span className="font-medium text-red-600">{answer}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Correct answer:</span>
              <span className="font-medium text-green-600">{feedback.correctAnswer}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-800 mb-1">Explanation</p>
              <p className="text-sm text-blue-700">{feedback.explanation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mastery Progress */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <span className="text-sm text-muted-foreground">Skill Mastery</span>
        <div className="flex items-center gap-2">
          <Progress value={feedback.masteryScore} className="w-20 h-2" />
          <span className="text-sm font-medium">{feedback.masteryScore}%</span>
        </div>
      </div>

      {/* Next Button */}
      <Button onClick={onNext} size="lg" className="w-full h-12 text-lg gap-2">
        {isLast ? (
          <>
            <Trophy className="w-5 h-5" />
            See Results
          </>
        ) : (
          <>
            <ChevronRight className="w-5 h-5" />
            Next Problem
          </>
        )}
      </Button>
    </motion.div>
  );
}

function CompleteScreen({ results, onPlayAgain }: { results: any; onPlayAgain: () => void }) {
  const [, navigate] = useLocation();
  const accuracy = results.accuracy ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-8 py-8"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 8, delay: 0.2 }}
      >
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl">
          <Trophy className="w-12 h-12 text-white" />
        </div>
      </motion.div>

      <div>
        <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
        <p className="text-muted-foreground">Great work! Here's how you did:</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg mx-auto">
        <div className="p-4 rounded-xl bg-green-50 border border-green-200">
          <p className="text-3xl font-bold text-green-700">{accuracy}%</p>
          <p className="text-xs text-green-600">Accuracy</p>
        </div>
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-3xl font-bold text-blue-700">{results.correctAnswers}</p>
          <p className="text-xs text-blue-600">Correct</p>
        </div>
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
          <p className="text-3xl font-bold text-purple-700">{results.totalProblems}</p>
          <p className="text-xs text-purple-600">Total</p>
        </div>
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
          <p className="text-3xl font-bold text-orange-700">{results.streak}</p>
          <p className="text-xs text-orange-600">Day Streak</p>
        </div>
      </div>

      {/* Badges earned */}
      {results.badgesEarned?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <h3 className="font-semibold text-lg">Badges Earned!</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {results.badgesEarned.map((badge: any, i: number) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.6 + i * 0.15, type: "spring" }}
              >
                <Badge className="py-2 px-4 text-base gap-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                  <span>{badge.icon}</span>
                  <span>{badge.title}</span>
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Encouragement */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 max-w-md mx-auto">
        <CardContent className="p-4">
          <p className="text-sm">
            {accuracy >= 90
              ? "🌟 Outstanding! You're a math superstar!"
              : accuracy >= 70
              ? "💪 Great job! Keep practicing to master more skills!"
              : accuracy >= 50
              ? "👍 Good effort! Try using hints to learn tricky problems."
              : "🤗 Don't worry! Every practice makes you stronger. Try again!"}
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-center">
        <Button onClick={onPlayAgain} size="lg" className="gap-2">
          <RotateCcw className="w-5 h-5" />
          Play Again
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate("/dashboard")} className="gap-2">
          <Home className="w-5 h-5" />
          Dashboard
        </Button>
      </div>
    </motion.div>
  );
}
