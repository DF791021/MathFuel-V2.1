import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { useRouter } from "wouter";

type GamePhase = "lobby" | "joining" | "waiting" | "playing" | "results";

interface Challenge {
  id: number;
  title: string;
  content: string;
  correctAnswer?: string;
  pointsReward: number;
  timeLimit?: number;
}

export function NutritionRoulette() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<GamePhase>("lobby");
  const [sessionCode, setSessionCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [playerAnswer, setPlayerAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [gameStatus, setGameStatus] = useState("waiting");
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(5);

  // tRPC mutations and queries
  const createSessionMutation = trpc.roulette.createSession.useMutation();
  const joinSessionMutation = trpc.roulette.joinSession.useMutation();
  const startSessionMutation = trpc.roulette.startSession.useMutation();
  const getSessionQuery = trpc.roulette.getSession.useQuery(
    { sessionCode: sessionCode || joinCode },
    { enabled: !!sessionCode || !!joinCode }
  );
  const getLeaderboardQuery = trpc.roulette.getLeaderboard.useQuery(
    { sessionCode: sessionCode || joinCode },
    { enabled: !!sessionCode || !!joinCode, refetchInterval: 1000 }
  );
  const getRandomChallengeQuery = trpc.roulette.getRandomChallenge.useQuery(
    { difficulty: "medium" },
    { enabled: false }
  );
  const submitAnswerMutation = trpc.roulette.submitAnswer.useMutation();
  const endSessionMutation = trpc.roulette.endSession.useMutation();

  // Update leaderboard
  useEffect(() => {
    if (getLeaderboardQuery.data) {
      setLeaderboard(getLeaderboardQuery.data);
    }
  }, [getLeaderboardQuery.data]);

  // Update game status
  useEffect(() => {
    if (getSessionQuery.data) {
      setGameStatus(getSessionQuery.data.gameStatus);
      setCurrentRound(getSessionQuery.data.currentRound);
      setTotalRounds(getSessionQuery.data.totalRounds);
    }
  }, [getSessionQuery.data]);

  // Timer for challenges
  useEffect(() => {
    if (phase === "playing" && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeRemaining === 0 && currentChallenge && phase === "playing") {
      handleSubmitAnswer();
    }
  }, [timeRemaining, phase, currentChallenge]);

  const handleCreateSession = async () => {
    const result = await createSessionMutation.mutateAsync({
      totalRounds: 5,
      difficulty: "medium",
    });
    setSessionCode(result.sessionCode);
    setPhase("waiting");
  };

  const handleJoinSession = async () => {
    if (!joinCode || !playerName) return;
    try {
      await joinSessionMutation.mutateAsync({
        sessionCode: joinCode,
        playerName,
      });
      setSessionCode(joinCode);
      setPhase("waiting");
    } catch (error) {
      alert("Failed to join session");
    }
  };

  const handleStartGame = async () => {
    if (!sessionCode) return;
    try {
      await startSessionMutation.mutateAsync({ sessionCode });
      setPhase("playing");
      spinRoulette();
    } catch (error) {
      alert("Failed to start game");
    }
  };

  const spinRoulette = async () => {
    setIsSpinning(true);
    const spins = Math.random() * 360 + 720;
    setWheelRotation((prev) => prev + spins);

    // Simulate spin animation
    setTimeout(() => {
      setIsSpinning(false);
      // Get random challenge
      const challenge: Challenge = {
        id: Math.floor(Math.random() * 100),
        title: "Nutrition Question",
        content: "Which food group is most important for bone health?",
        correctAnswer: "Dairy",
        pointsReward: 100,
        timeLimit: 30,
      };
      setCurrentChallenge(challenge);
      setTimeRemaining(challenge.timeLimit || 30);
      setPlayerAnswer("");
    }, 2000);
  };

  const handleSubmitAnswer = async () => {
    if (!sessionCode || !currentChallenge) return;

    try {
      const result = await submitAnswerMutation.mutateAsync({
        sessionCode,
        challengeId: currentChallenge.id,
        playerAnswer: playerAnswer || "timeout",
        timeSpent: (currentChallenge.timeLimit || 30) - timeRemaining,
      });

      // Show result briefly
      alert(result.message + ` +${result.pointsEarned} points`);

      // Next round or end game
      if (currentRound < totalRounds) {
        setCurrentChallenge(null);
        setTimeout(() => spinRoulette(), 1000);
      } else {
        setPhase("results");
        await endSessionMutation.mutateAsync({ sessionCode });
      }
    } catch (error) {
      alert("Error submitting answer");
    }
  };

  // Lobby Phase
  if (phase === "lobby") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-4xl font-bold text-center mb-2 text-green-700">
            🎡 Nutrition Roulette
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Spin the wheel, answer questions, and compete with your classmates!
          </p>

          <div className="space-y-4">
            <Button
              onClick={handleCreateSession}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? "Creating..." : "🎮 Create Game"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            <div className="space-y-3">
              <Input
                placeholder="Enter game code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="text-center text-lg tracking-widest"
              />
              <Input
                placeholder="Your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
              <Button
                onClick={handleJoinSession}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                disabled={joinSessionMutation.isPending || !joinCode || !playerName}
              >
                {joinSessionMutation.isPending ? "Joining..." : "👥 Join Game"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Waiting/Playing Phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-green-700">🎡 Nutrition Roulette</h1>
            <p className="text-gray-600">Game Code: <span className="font-mono font-bold text-lg">{sessionCode}</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Round</p>
            <p className="text-3xl font-bold text-blue-600">{currentRound}/{totalRounds}</p>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Roulette Wheel */}
          <div className="lg:col-span-2">
            <Card className="p-8 bg-white shadow-lg">
              {phase === "waiting" && gameStatus === "waiting" ? (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-600 mb-6">Waiting for game to start...</p>
                  <p className="text-gray-500 mb-8">Players in session: {getSessionQuery.data?.players?.length || 0}</p>
                  {user?.id === getSessionQuery.data?.teacherId && (
                    <Button
                      onClick={handleStartGame}
                      className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                    >
                      🎮 Start Game
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Roulette Wheel SVG */}
                  <div className="relative w-64 h-64 mb-8">
                    <svg
                      viewBox="0 0 200 200"
                      className="w-full h-full"
                      style={{
                        transform: `rotate(${wheelRotation}deg)`,
                        transition: isSpinning ? "none" : "transform 0.3s ease-out",
                      }}
                    >
                      {/* Wheel segments */}
                      {[0, 1, 2, 3, 4].map((i) => {
                        const angle = (i * 72) * (Math.PI / 180);
                        const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];
                        return (
                          <g key={i}>
                            <path
                              d={`M 100 100 L ${100 + 80 * Math.cos(angle)} ${100 + 80 * Math.sin(angle)} A 80 80 0 0 1 ${100 + 80 * Math.cos(angle + (72 * Math.PI / 180))} ${100 + 80 * Math.sin(angle + (72 * Math.PI / 180))} Z`}
                              fill={colors[i]}
                              stroke="white"
                              strokeWidth="2"
                            />
                            <text
                              x={100 + 50 * Math.cos(angle + (36 * Math.PI / 180))}
                              y={100 + 50 * Math.sin(angle + (36 * Math.PI / 180))}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="12"
                              fontWeight="bold"
                              className="pointer-events-none"
                            >
                              {["Trivia", "Match", "Recipe", "Wellness", "Speed"][i]}
                            </text>
                          </g>
                        );
                      })}
                      {/* Center circle */}
                      <circle cx="100" cy="100" r="15" fill="white" stroke="#333" strokeWidth="2" />
                    </svg>

                    {/* Pointer */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-red-600"></div>
                    </div>
                  </div>

                  {/* Spin Button */}
                  {!currentChallenge && (
                    <Button
                      onClick={spinRoulette}
                      disabled={isSpinning}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-xl font-bold rounded-full"
                    >
                      {isSpinning ? "🔄 Spinning..." : "🎯 SPIN!"}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Leaderboard */}
          <div>
            <Card className="p-6 bg-white shadow-lg">
              <h2 className="text-2xl font-bold mb-4 text-green-700">🏆 Leaderboard</h2>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((player, index) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-gray-400 w-6">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                      </span>
                      <span className="font-semibold text-gray-800">{player.playerName}</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">{player.totalScore}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Challenge Display */}
        {currentChallenge && phase === "playing" && (
          <Card className="p-8 bg-white shadow-lg mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-700">{currentChallenge.title}</h2>
              <div className="text-3xl font-bold text-red-600">
                ⏱️ {timeRemaining}s
              </div>
            </div>

            <p className="text-lg text-gray-700 mb-6">{currentChallenge.content}</p>

            <div className="flex gap-4">
              <Input
                placeholder="Your answer..."
                value={playerAnswer}
                onChange={(e) => setPlayerAnswer(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSubmitAnswer()}
                className="text-lg py-3"
                autoFocus
              />
              <Button
                onClick={handleSubmitAnswer}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              >
                Submit
              </Button>
            </div>
          </Card>
        )}

        {/* Results Phase */}
        {phase === "results" && (
          <Card className="p-8 bg-white shadow-lg text-center">
            <h2 className="text-4xl font-bold mb-6 text-green-700">🎉 Game Over!</h2>
            <p className="text-xl text-gray-600 mb-8">Final Leaderboard</p>
            <div className="space-y-3 mb-8">
              {leaderboard.map((player, index) => (
                <div key={player.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-lg font-semibold">{index + 1}. {player.playerName}</span>
                  <span className="text-2xl font-bold text-blue-600">{player.totalScore}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => {
                setPhase("lobby");
                setSessionCode("");
                setJoinCode("");
                setPlayerName("");
                window.location.reload();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              Play Again
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
