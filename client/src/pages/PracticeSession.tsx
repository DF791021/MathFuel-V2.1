import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, XCircle, Lightbulb, ChevronRight,
  Play, Trophy, Sparkles, Clock, Zap, RotateCcw, Home, Bot,
  ThumbsUp, ThumbsDown,
} from "lucide-react";
import { toast } from "sonner";

const PROBLEMS_PER_SESSION = 10;

type SessionState = "setup" | "playing" | "feedback" | "complete";
type Problem = {
  id: number; skillId: number; problemType: string; difficulty: number;
  questionText: string; questionImage: string | null; answerType: string; choices: any;
};
type FeedbackData = {
  isCorrect: boolean; correctAnswer: string; explanation: string;
  hintSteps: any; masteryScore: number; masteryLevel: string; streak: number;
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
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [aiSessionSummary, setAiSessionSummary] = useState<string | null>(null);
  const [hintRatings, setHintRatings] = useState<Record<number, "up" | "down">>({});
  const [explanationRating, setExplanationRating] = useState<"up" | "down" | null>(null);
  const [summaryRating, setSummaryRating] = useState<"up" | "down" | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const gradeLevel = user?.gradeLevel ?? 1;

  useEffect(() => { document.title = "Practice - MathFuel"; }, []);
  useEffect(() => {
    if (!authLoading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [authLoading, isAuthenticated]);

  const startSessionMutation = trpc.practice.startSession.useMutation({
    onSuccess: (data) => { setSessionId(data.sessionId); setState("playing"); setProblemCount(0); setCorrectCount(0); },
    onError: (err) => toast.error("Failed to start session: " + err.message),
  });

  const submitAnswerMutation = trpc.practice.submitAnswer.useMutation({
    onSuccess: (data) => {
      setFeedback(data); setState("feedback");
      if (data.isCorrect) setCorrectCount((c) => c + 1);
      setIsSubmitting(false);
      if (currentProblem) fetchAIExplanation(currentProblem.id, answer, data.isCorrect);
    },
    onError: (err) => { toast.error("Failed to submit: " + err.message); setIsSubmitting(false); },
  });

  const completeSessionMutation = trpc.practice.completeSession.useMutation({
    onSuccess: (data) => { setSessionResults(data); setState("complete"); fetchAISessionSummary(data); },
    onError: (err) => toast.error("Failed to complete session: " + err.message),
  });

  const aiHintMutation = trpc.aiTutor.getAIHint.useMutation();
  const aiExplanationMutation = trpc.aiTutor.getAIExplanation.useMutation();
  const aiSessionSummaryMutation = trpc.aiTutor.getSessionSummary.useMutation();
  const submitFeedbackMutation = trpc.aiTutor.submitFeedback.useMutation();

  const handleRateAI = useCallback((params: {
    responseType: "hint" | "explanation" | "session_summary";
    rating: "up" | "down"; aiResponseText?: string; hintIndex?: number;
  }) => {
    submitFeedbackMutation.mutate({
      sessionId: sessionId ?? undefined, problemId: currentProblem?.id ?? undefined,
      responseType: params.responseType, rating: params.rating, aiResponseText: params.aiResponseText,
    });
    if (params.responseType === "hint" && params.hintIndex !== undefined) {
      setHintRatings(prev => ({ ...prev, [params.hintIndex!]: params.rating }));
    } else if (params.responseType === "explanation") {
      setExplanationRating(params.rating);
    } else if (params.responseType === "session_summary") {
      setSummaryRating(params.rating);
    }
  }, [submitFeedbackMutation, sessionId, currentProblem]);

  const fetchAIExplanation = useCallback(async (problemId: number, studentAnswer: string, isCorrect: boolean) => {
    setIsLoadingExplanation(true); setAiExplanation(null);
    try {
      const result = await aiExplanationMutation.mutateAsync({ problemId, studentAnswer, isCorrect });
      setAiExplanation(result.explanation);
    } catch { console.error("AI explanation failed"); }
    finally { setIsLoadingExplanation(false); }
  }, [aiExplanationMutation]);

  const fetchAISessionSummary = useCallback(async (results: any) => {
    try {
      const result = await aiSessionSummaryMutation.mutateAsync({
        totalProblems: results.totalProblems ?? 0, correctAnswers: results.correctAnswers ?? 0,
        hintsUsed: 0, streak: results.streak ?? 0,
      });
      setAiSessionSummary(result.summary);
    } catch { console.error("AI summary failed"); }
  }, [aiSessionSummaryMutation]);

  const fetchNextProblem = useCallback(async () => {
    if (!sessionId) return;
    try {
      const problem = await utils.client.practice.getNextProblem.query({ sessionId, gradeLevel });
      if (problem) {
        setCurrentProblem(problem); setAnswer(""); setHintsViewed(0); setVisibleHints([]);
        setStartTime(Date.now()); setProblemCount((c) => c + 1); setState("playing");
        setAiExplanation(null); setIsLoadingExplanation(false); setHintRatings({}); setExplanationRating(null);
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        completeSessionMutation.mutate({ sessionId });
      }
    } catch (err: any) { toast.error("Failed to load problem: " + err.message); }
  }, [sessionId, gradeLevel, utils, completeSessionMutation]);

  const handleStart = () => {
    startSessionMutation.mutate({ sessionType: "daily", skillIds: skillId ? [skillId] : undefined, gradeLevel });
  };

  useEffect(() => {
    if (sessionId && state === "playing" && !currentProblem) fetchNextProblem();
  }, [sessionId, state, currentProblem, fetchNextProblem]);

  const handleSubmit = () => {
    if (!answer.trim() || !currentProblem || !sessionId || isSubmitting) return;
    setIsSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    submitAnswerMutation.mutate({ sessionId, problemId: currentProblem.id, answer: answer.trim(), timeSpentSeconds: timeSpent, hintsViewed });
  };

  const handleGetHint = async () => {
    if (!currentProblem) return;
    try {
      const result = await aiHintMutation.mutateAsync({ problemId: currentProblem.id, hintsUsed: hintsViewed, previousHints: visibleHints });
      if (result.hint) { setVisibleHints((prev) => [...prev, result.hint]); setHintsViewed((h) => h + 1); }
      else toast.info("No more hints available!");
    } catch {
      try {
        const result = await utils.client.practice.getHint.query({ problemId: currentProblem.id, hintIndex: hintsViewed });
        if (result.hint) { setVisibleHints((prev) => [...prev, result.hint!]); setHintsViewed((h) => h + 1); }
        else toast.info("No more hints available!");
      } catch { toast.error("Failed to get hint"); }
    }
  };

  const handleNext = () => {
    if (problemCount >= PROBLEMS_PER_SESSION && sessionId) {
      completeSessionMutation.mutate({ sessionId });
    } else {
      setCurrentProblem(null); setFeedback(null); setAiExplanation(null); fetchNextProblem();
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Compact header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-between h-11 sm:h-14">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1 px-2 sm:px-3 h-8 sm:h-10 text-xs sm:text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
          {(state === "playing" || state === "feedback") && (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">
                {problemCount}/{PROBLEMS_PER_SESSION}
              </span>
              <Progress value={(problemCount / PROBLEMS_PER_SESSION) * 100} className="w-16 sm:w-24 h-1.5 sm:h-2" />
              <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs py-0.5 px-1.5 sm:px-2">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {correctCount}
              </Badge>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 sm:py-6 safe-bottom">
        <AnimatePresence mode="wait">
          {state === "setup" && (
            <SetupScreen key="setup" onStart={handleStart} isLoading={startSessionMutation.isPending} skillId={skillId} />
          )}
          {state === "playing" && currentProblem && (
            <ProblemScreen
              key={`problem-${currentProblem.id}`}
              problem={currentProblem} answer={answer} setAnswer={setAnswer}
              onSubmit={handleSubmit} onGetHint={handleGetHint}
              visibleHints={visibleHints} hintsViewed={hintsViewed}
              isSubmitting={isSubmitting} isLoadingHint={aiHintMutation.isPending}
              inputRef={inputRef} hintRatings={hintRatings}
              onRateHint={(index, rating, text) => handleRateAI({ responseType: "hint", rating, aiResponseText: text, hintIndex: index })}
            />
          )}
          {state === "playing" && !currentProblem && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center py-16 sm:py-20">
              <div className="text-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading next problem...</p>
              </div>
            </motion.div>
          )}
          {state === "feedback" && feedback && currentProblem && (
            <FeedbackScreen
              key="feedback" feedback={feedback} problem={currentProblem} answer={answer}
              onNext={handleNext} isLast={problemCount >= PROBLEMS_PER_SESSION}
              aiExplanation={aiExplanation} isLoadingExplanation={isLoadingExplanation}
              explanationRating={explanationRating}
              onRateExplanation={(rating, text) => handleRateAI({ responseType: "explanation", rating, aiResponseText: text })}
            />
          )}
          {state === "complete" && sessionResults && (
            <CompleteScreen
              key="complete" results={sessionResults} aiSummary={aiSessionSummary}
              summaryRating={summaryRating}
              onRateSummary={(rating, text) => handleRateAI({ responseType: "session_summary", rating, aiResponseText: text })}
              onPlayAgain={() => {
                setState("setup"); setSessionId(null); setCurrentProblem(null); setFeedback(null);
                setSessionResults(null); setAiExplanation(null); setAiSessionSummary(null); setSummaryRating(null);
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

/* ─── Setup Screen ─── */
function SetupScreen({ onStart, isLoading, skillId }: { onStart: () => void; isLoading: boolean; skillId?: number; }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6 sm:space-y-8 py-8 sm:py-12"
    >
      <div>
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg mb-4 sm:mb-6"
        >
          <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </motion.div>
        <h1 className="!text-2xl sm:!text-3xl font-bold mb-2">Ready to Practice?</h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto px-2">
          You'll solve {PROBLEMS_PER_SESSION} problems. MathBuddy is here to help when you're stuck!
        </p>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <Bot className="w-4 h-4 text-primary" />
        <span>AI tutor — personalized hints & explanations</span>
      </div>

      {skillId && (
        <Badge variant="secondary" className="text-xs sm:text-sm py-1 px-3">
          Focused: Skill #{skillId}
        </Badge>
      )}

      <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-xs sm:max-w-sm mx-auto text-center">
        <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50">
          <p className="text-xl sm:text-2xl font-bold text-primary">{PROBLEMS_PER_SESSION}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Problems</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50">
          <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-yellow-500" />
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">AI Hints</p>
        </div>
        <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50">
          <Clock className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-blue-500" />
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Your Pace</p>
        </div>
      </div>

      <Button onClick={onStart} size="lg" disabled={isLoading}
        className="h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg gap-2 rounded-full shadow-lg w-full sm:w-auto"
      >
        {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : <Play className="w-5 h-5" />}
        {isLoading ? "Starting..." : "Let's Go!"}
      </Button>
    </motion.div>
  );
}

/* ─── Rating Buttons ─── */
function RatingButtons({ currentRating, onRate }: { currentRating: "up" | "down" | null; onRate: (rating: "up" | "down") => void; }) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => onRate("up")} aria-label="Helpful"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                currentRating === "up" ? "bg-green-100 text-green-600 scale-110 ring-2 ring-green-300" : "hover:bg-green-50 text-muted-foreground hover:text-green-500"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Helpful!</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={() => onRate("down")} aria-label="Not helpful"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                currentRating === "down" ? "bg-red-100 text-red-500 scale-110 ring-2 ring-red-300" : "hover:bg-red-50 text-muted-foreground hover:text-red-400"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Not helpful</TooltipContent>
        </Tooltip>
        {currentRating && (
          <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-[10px] text-muted-foreground ml-0.5">
            Thanks!
          </motion.span>
        )}
      </div>
    </TooltipProvider>
  );
}

/* ─── Problem Screen ─── */
function ProblemScreen({ problem, answer, setAnswer, onSubmit, onGetHint, visibleHints, hintsViewed, isSubmitting, isLoadingHint, inputRef, hintRatings, onRateHint }: {
  problem: Problem; answer: string; setAnswer: (v: string) => void; onSubmit: () => void;
  onGetHint: () => void; visibleHints: string[]; hintsViewed: number; isSubmitting: boolean;
  isLoadingHint: boolean; inputRef: React.RefObject<HTMLInputElement | null>;
  hintRatings: Record<number, "up" | "down">; onRateHint: (index: number, rating: "up" | "down", text: string) => void;
}) {
  const choices = problem.choices ? (typeof problem.choices === "string" ? JSON.parse(problem.choices) : problem.choices) : null;

  return (
    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }} className="space-y-4 sm:space-y-6"
    >
      {/* Difficulty + type */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((d) => (
            <div key={d} className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${d <= problem.difficulty ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <Badge variant="secondary" className="text-[10px] sm:text-xs py-0.5 px-1.5 sm:px-2">
          {problem.problemType.replace("_", " ")}
        </Badge>
      </div>

      {/* Question Card */}
      <Card className="border-2">
        <CardContent className="p-4 sm:p-8">
          <p className="text-lg sm:text-2xl font-semibold text-center leading-relaxed">
            {problem.questionText}
          </p>
          {problem.questionImage && (
            <img src={problem.questionImage} alt="Question" className="max-w-[200px] sm:max-w-xs mx-auto mt-4 rounded-lg" />
          )}
        </CardContent>
      </Card>

      {/* Answer Input */}
      <div className="space-y-3 sm:space-y-4">
        {choices ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            {(choices as string[]).map((choice: string, i: number) => (
              <Button key={i} variant={answer === choice ? "default" : "outline"}
                className={`p-3 sm:p-4 h-auto text-left text-sm sm:text-base justify-start ${answer === choice ? "ring-2 ring-primary" : ""}`}
                onClick={() => setAnswer(choice)}
              >
                <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-xs sm:text-sm font-bold mr-2 sm:mr-3 flex-shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                {choice}
              </Button>
            ))}
          </div>
        ) : (
          <Input ref={inputRef} type={problem.answerType === "number" ? "number" : "text"}
            value={answer} onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            placeholder="Type your answer..." className="text-base sm:text-lg h-12 sm:h-14 text-center" autoFocus
          />
        )}

        {/* Submit + Hint buttons */}
        <div className="flex gap-2 sm:gap-3">
          <Button onClick={onSubmit} disabled={!answer.trim() || isSubmitting}
            className="flex-1 h-11 sm:h-12 text-sm sm:text-lg gap-1.5 sm:gap-2"
          >
            {isSubmitting ? <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white" /> : <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            {isSubmitting ? "Checking..." : "Submit"}
          </Button>
          <Button variant="outline" onClick={onGetHint} disabled={isLoadingHint}
            className="h-11 sm:h-12 gap-1.5 sm:gap-2 px-3 sm:px-4"
          >
            {isLoadingHint ? <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-yellow-500" /> : <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />}
            <span className="hidden sm:inline">{isLoadingHint ? "Thinking..." : "Hint"}</span>
          </Button>
        </div>
      </div>

      {/* AI Hints */}
      <AnimatePresence>
        {visibleHints.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-2">
            {visibleHints.map((hint, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="flex gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-yellow-50 border border-yellow-200"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-200 flex items-center justify-center">
                    <Bot className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-700" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-yellow-600 mb-0.5">Hint {i + 1}</p>
                  <p className="text-xs sm:text-sm text-yellow-800 leading-relaxed">{hint}</p>
                </div>
                <div className="flex-shrink-0 self-center">
                  <RatingButtons currentRating={hintRatings[i] ?? null} onRate={(rating) => onRateHint(i, rating, hint)} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Feedback Screen ─── */
function FeedbackScreen({ feedback, problem, answer, onNext, isLast, aiExplanation, isLoadingExplanation, explanationRating, onRateExplanation }: {
  feedback: FeedbackData; problem: Problem; answer: string; onNext: () => void; isLast: boolean;
  aiExplanation: string | null; isLoadingExplanation: boolean;
  explanationRating: "up" | "down" | null; onRateExplanation: (rating: "up" | "down", text: string) => void;
}) {
  const displayExplanation = aiExplanation || feedback.explanation;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Result Banner */}
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 10 }}>
        <Card className={`border-2 ${feedback.isCorrect ? "border-green-300 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <CardContent className="p-4 sm:p-6 text-center">
            <motion.div initial={{ rotate: -10, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>
              {feedback.isCorrect ? (
                <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-500 mx-auto mb-2 sm:mb-3" />
              ) : (
                <XCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-400 mx-auto mb-2 sm:mb-3" />
              )}
            </motion.div>
            <h2 className={`!text-xl sm:!text-2xl font-bold ${feedback.isCorrect ? "text-green-700" : "text-red-700"}`}>
              {feedback.isCorrect ? "Correct!" : "Not Quite!"}
            </h2>
            {feedback.isCorrect && feedback.streak > 1 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-green-600 mt-1 text-sm">
                🔥 {feedback.streak} in a row!
              </motion.p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Answer Details */}
      {!feedback.isCorrect && (
        <Card>
          <CardContent className="p-3 sm:p-4 space-y-1.5 sm:space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Your answer:</span>
              <span className="font-medium text-red-600">{answer}</span>
            </div>
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Correct answer:</span>
              <span className="font-medium text-green-600">{feedback.correctAnswer}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-200 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-700" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-xs sm:text-sm font-medium text-blue-800">MathBuddy says:</p>
                {aiExplanation && (
                  <Badge variant="secondary" className="text-[8px] sm:text-[10px] py-0 px-1 sm:px-1.5 bg-blue-100 text-blue-600 border-blue-200">
                    <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />AI
                  </Badge>
                )}
              </div>
              {isLoadingExplanation ? (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500" />
                  <span>MathBuddy is thinking...</span>
                </div>
              ) : (
                <>
                  <p className="text-xs sm:text-sm text-blue-700 leading-relaxed">{displayExplanation}</p>
                  <div className="mt-1.5 sm:mt-2 flex items-center gap-2">
                    <span className="text-[9px] sm:text-[10px] text-blue-400">Was this helpful?</span>
                    <RatingButtons currentRating={explanationRating} onRate={(rating) => onRateExplanation(rating, displayExplanation)} />
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mastery Progress */}
      <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50">
        <span className="text-xs sm:text-sm text-muted-foreground">Skill Mastery</span>
        <div className="flex items-center gap-2">
          <Progress value={feedback.masteryScore} className="w-16 sm:w-20 h-1.5 sm:h-2" />
          <span className="text-xs sm:text-sm font-medium">{feedback.masteryScore}%</span>
        </div>
      </div>

      {/* Next Button */}
      <Button onClick={onNext} size="lg" className="w-full h-11 sm:h-12 text-sm sm:text-lg gap-2">
        {isLast ? <><Trophy className="w-4 h-4 sm:w-5 sm:h-5" /> See Results</> : <><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" /> Next Problem</>}
      </Button>
    </motion.div>
  );
}

/* ─── Complete Screen ─── */
function CompleteScreen({ results, aiSummary, summaryRating, onRateSummary, onPlayAgain }: {
  results: any; aiSummary: string | null; summaryRating: "up" | "down" | null;
  onRateSummary: (rating: "up" | "down", text: string) => void; onPlayAgain: () => void;
}) {
  const [, navigate] = useLocation();
  const accuracy = results.accuracy ?? 0;

  const displaySummary = aiSummary || (
    accuracy >= 90 ? "Outstanding! You're a math superstar!"
    : accuracy >= 70 ? "Great job! Keep practicing to master more skills!"
    : accuracy >= 50 ? "Good effort! Try using hints to learn tricky problems."
    : "Don't worry! Every practice makes you stronger. Try again!"
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-5 sm:space-y-8 py-6 sm:py-8"
    >
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 8, delay: 0.2 }}>
        <div className="w-18 h-18 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl" style={{ width: "4.5rem", height: "4.5rem" }}>
          <Trophy className="w-9 h-9 sm:w-12 sm:h-12 text-white" />
        </div>
      </motion.div>

      <div>
        <h1 className="!text-2xl sm:!text-3xl font-bold mb-1 sm:mb-2">Session Complete!</h1>
        <p className="text-xs sm:text-base text-muted-foreground">Great work! Here's how you did:</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-lg mx-auto">
        {[
          { value: `${accuracy}%`, label: "Accuracy", bg: "bg-green-50 border-green-200", text: "text-green-700", sub: "text-green-600" },
          { value: results.correctAnswers, label: "Correct", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", sub: "text-blue-600" },
          { value: results.totalProblems, label: "Total", bg: "bg-purple-50 border-purple-200", text: "text-purple-700", sub: "text-purple-600" },
          { value: results.streak, label: "Day Streak", bg: "bg-orange-50 border-orange-200", text: "text-orange-700", sub: "text-orange-600" },
        ].map((stat, i) => (
          <div key={i} className={`p-3 sm:p-4 rounded-xl ${stat.bg} border`}>
            <p className={`text-xl sm:text-3xl font-bold ${stat.text}`}>{stat.value}</p>
            <p className={`text-[10px] sm:text-xs ${stat.sub}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Badges earned */}
      {results.badgesEarned?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-2 sm:space-y-3">
          <h3 className="font-semibold text-base sm:text-lg">Badges Earned!</h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
            {results.badgesEarned.map((badge: any, i: number) => (
              <motion.div key={i} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.6 + i * 0.15, type: "spring" }}>
                <Badge className="py-1.5 px-3 sm:py-2 sm:px-4 text-xs sm:text-base gap-1.5 sm:gap-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                  <span>{badge.icon}</span>
                  <span>{badge.title}</span>
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* AI encouragement */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 max-w-md mx-auto">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              </div>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-[10px] sm:text-xs font-medium text-primary">MathBuddy</p>
                  {aiSummary && (
                    <Badge variant="secondary" className="text-[8px] sm:text-[10px] py-0 px-1 sm:px-1.5">
                      <Sparkles className="w-2 h-2 sm:w-2.5 sm:h-2.5 mr-0.5" />AI
                    </Badge>
                  )}
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">{displaySummary}</p>
                <div className="mt-1.5 sm:mt-2 flex items-center gap-2">
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground">Was this helpful?</span>
                  <RatingButtons currentRating={summaryRating} onRate={(rating) => onRateSummary(rating, displaySummary)} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex gap-2 sm:gap-3 justify-center">
        <Button onClick={onPlayAgain} size="lg" className="gap-1.5 sm:gap-2 text-sm sm:text-base h-11 sm:h-12 px-4 sm:px-6">
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          Play Again
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate("/dashboard")} className="gap-1.5 sm:gap-2 text-sm sm:text-base h-11 sm:h-12 px-4 sm:px-6">
          <Home className="w-4 h-4 sm:w-5 sm:h-5" />
          Dashboard
        </Button>
      </div>
    </motion.div>
  );
}
