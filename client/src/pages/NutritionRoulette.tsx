import { useState, useEffect } from "react";
import { useRouter } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/_core/hooks/useAuth";
import { useGameSocket } from "@/hooks/useGameSocket";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface LeaderboardEntry {
  playerId: string;
  name: string;
  score: number;
  streak: number;
  position: number;
}

export function NutritionRoulette() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"lobby" | "joining" | "playing" | "results">("lobby");
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [userRole, setUserRole] = useState<"teacher" | "player">("player");
  const [isJoined, setIsJoined] = useState(false);

  // WebSocket integration
  const gameSocket = useGameSocket(gameCode, playerName);

  // Challenge wheel data
  const wheelData = [
    { name: "Trivia", value: 1, color: "#ef4444" },
    { name: "Match", value: 1, color: "#06b6d4" },
    { name: "Recipe", value: 1, color: "#3b82f6" },
    { name: "Wellness", value: 1, color: "#f97316" },
    { name: "Speed", value: 1, color: "#84cc16" },
  ];

  const handleCreateGame = async () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGameCode(code);
    setIsJoined(true);
    setPhase("playing");
  };

  const handleJoinGame = () => {
    if (gameCode && playerName) {
      setIsJoined(true);
      setPhase("playing");
    }
  };

  const handleSubmitAnswer = () => {
    if (gameSocket.currentChallenge) {
      gameSocket.submitAnswer("");
    }
  };

  useEffect(() => {
    if (isJoined && gameSocket.isConnected) {
      console.log("[Game] Connected to WebSocket");
    }
  }, [isJoined, gameSocket.isConnected]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">🎡 Nutrition Roulette</h1>
          <p className="text-gray-600">Spin the wheel, answer questions, and compete with your classmates!</p>
          {gameSocket.isConnected && (
            <p className="text-sm text-green-600 mt-2">✅ Connected to game server</p>
          )}
        </div>

        {/* Lobby Phase */}
        {phase === "lobby" && (
          <div className="max-w-2xl mx-auto">
            {/* Role Selection */}
            <Card className="p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Select Your Role</h2>
              <div className="flex gap-4">
                <Button
                  onClick={() => setUserRole("teacher")}
                  variant={userRole === "teacher" ? "default" : "outline"}
                  className="flex-1"
                >
                  👨‍🏫 Teacher
                </Button>
                <Button
                  onClick={() => setUserRole("player")}
                  variant={userRole === "player" ? "default" : "outline"}
                  className="flex-1"
                >
                  👨‍🎓 Player
                </Button>
              </div>
            </Card>

            {/* Teacher: Create Game */}
            {userRole === "teacher" && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Create a Game Session</h2>
                <p className="text-gray-600 mb-4">Start a new game and share the code with your students.</p>
                <Button onClick={handleCreateGame} className="w-full bg-green-600 hover:bg-green-700">
                  Create Game
                </Button>
              </Card>
            )}

            {/* Player: Join Game */}
            {userRole === "player" && (
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Join a Game Session</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Name</label>
                    <Input
                      placeholder="Enter your name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Game Code</label>
                    <Input
                      placeholder="Enter game code"
                      value={gameCode}
                      onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleJoinGame}
                    disabled={!gameCode || !playerName}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Join Game
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Playing Phase */}
        {phase === "playing" && isJoined && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Game Area */}
            <div className="lg:col-span-2">
              {/* Game Code */}
              <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Game Code:</span>
                  <span className="text-2xl font-bold text-blue-600">{gameCode}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-medium text-gray-600">Round:</span>
                  <span className="text-lg font-bold">{gameSocket.gameState === "ended" ? "5/5" : "0/5"}</span>
                </div>
              </Card>

              {/* Roulette Wheel */}
              <Card className="p-6 mb-4">
                <h3 className="text-lg font-bold mb-4 text-center">Challenge Wheel</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={wheelData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name }) => name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {wheelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {userRole === "teacher" && (
                  <Button onClick={() => gameSocket.spinRoulette()} className="w-full mt-4 bg-green-600">
                    Spin Wheel
                  </Button>
                )}
              </Card>

              {/* Challenge Display */}
              {gameSocket.currentChallenge && gameSocket.gameState === "answering" && (
                <Card className="p-6 mb-4 border-2 border-orange-400">
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-600 mb-2">Challenge Type</p>
                    <p className="text-2xl font-bold text-orange-600 capitalize">
                      {gameSocket.currentChallenge.type}
                    </p>
                  </div>
                  <p className="text-lg font-semibold mb-4">{gameSocket.currentChallenge.question}</p>
                  <div className="flex items-center justify-between mb-4">
                    <Input placeholder="Your answer..." />
                    <Button onClick={handleSubmitAnswer} className="ml-2 bg-green-600">
                      Submit
                    </Button>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">{gameSocket.timerSeconds}s</p>
                  </div>
                </Card>
              )}

              {/* Answer Feedback */}
              {gameSocket.answerFeedback && (
                <Card
                  className={`p-4 mb-4 ${
                    gameSocket.answerFeedback.isCorrect ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400"
                  }`}
                >
                  <p className="text-lg font-bold">
                    {gameSocket.answerFeedback.isCorrect ? "✅ Correct!" : "❌ Incorrect"}
                  </p>
                  <p className="text-sm">+{gameSocket.answerFeedback.points} points</p>
                </Card>
              )}
            </div>

            {/* Leaderboard Sidebar */}
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-bold mb-4">🏆 Leaderboard</h3>
                <div className="space-y-2">
                  {gameSocket.leaderboard.map((entry: LeaderboardEntry, index: number) => (
                    <div key={entry.playerId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-400">#{entry.position}</span>
                        <div>
                          <p className="font-semibold text-sm">{entry.name}</p>
                          <p className="text-xs text-gray-500">Streak: {entry.streak}</p>
                        </div>
                      </div>
                      <p className="font-bold text-lg text-green-600">{entry.score}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">Players: {gameSocket.playerCount}</p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
