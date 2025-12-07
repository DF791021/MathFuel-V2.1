import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CHALLENGE_CARDS, FUN_FACT_CARDS, ChallengeCard, FunFactCard } from "@/lib/gameData";
import { trpc } from "@/lib/trpc";
import { Trophy, Star, Sparkles, Volume2, VolumeX, Users, Play, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";

type GameState = "setup" | "playing" | "finished";

type Player = {
  id: number;
  name: string;
  avatar: string;
  position: number;
  score: number;
  color: string;
};

type Space = {
  id: number;
  type: "start" | "challenge" | "fact" | "bonus" | "finish";
  x: number;
  y: number;
};

const AVATARS = [
  { id: "cheese", src: "/images/cheese-wedge-piece.png", name: "Cheddar", color: "bg-yellow-400" },
  { id: "cranberry", src: "/images/cranberry-piece.png", name: "Berry", color: "bg-red-500" },
  { id: "corn", src: "/images/corn-cob-piece.png", name: "Corny", color: "bg-amber-400" },
  { id: "milk", src: "/images/milk-carton-piece.png", name: "Milky", color: "bg-blue-300" },
];

const BOARD_SPACES: Space[] = [
  { id: 0, type: "start", x: 50, y: 88 },
  { id: 1, type: "challenge", x: 30, y: 82 },
  { id: 2, type: "fact", x: 15, y: 72 },
  { id: 3, type: "challenge", x: 12, y: 58 },
  { id: 4, type: "bonus", x: 20, y: 45 },
  { id: 5, type: "challenge", x: 35, y: 38 },
  { id: 6, type: "fact", x: 50, y: 35 },
  { id: 7, type: "challenge", x: 65, y: 38 },
  { id: 8, type: "challenge", x: 80, y: 45 },
  { id: 9, type: "bonus", x: 85, y: 32 },
  { id: 10, type: "fact", x: 75, y: 22 },
  { id: 11, type: "challenge", x: 60, y: 15 },
  { id: 12, type: "finish", x: 50, y: 8 },
];

export default function GameBoard() {
  const [gameState, setGameState] = useState<GameState>("setup");
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""]);
  const [selectedAvatars, setSelectedAvatars] = useState<number[]>([0, 1]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [showCard, setShowCard] = useState(false);
  const [cardType, setCardType] = useState<"challenge" | "fact" | "bonus" | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeCard | null>(null);
  const [currentFact, setCurrentFact] = useState<FunFactCard | null>(null);
  const [gameMessage, setGameMessage] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const saveScoreMutation = trpc.game.saveScore.useMutation();
  const { data: leaderboard } = trpc.game.getLeaderboard.useQuery({ limit: 5 });

  const currentPlayer = players[currentPlayerIndex];

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#eab308', '#ef4444', '#3b82f6']
    });
  }, []);

  const startGame = () => {
    const newPlayers: Player[] = playerNames
      .filter((name, i) => name.trim() || i < 2)
      .map((name, i) => {
        const avatar = AVATARS[selectedAvatars[i] ?? i];
        return {
          id: i + 1,
          name: name.trim() || avatar.name,
          avatar: avatar.src,
          position: 0,
          score: 0,
          color: avatar.color,
        };
      });
    
    if (newPlayers.length < 1) {
      newPlayers.push({
        id: 1,
        name: AVATARS[0].name,
        avatar: AVATARS[0].src,
        position: 0,
        score: 0,
        color: AVATARS[0].color,
      });
    }
    
    setPlayers(newPlayers);
    setGameState("playing");
    setGameMessage(`${newPlayers[0].name}'s turn! Roll the dice!`);
  };

  const handleRollDice = () => {
    if (isRolling || !currentPlayer) return;
    setIsRolling(true);
    
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 12) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        movePlayer(finalRoll);
      }
    }, 80);
  };

  const movePlayer = (steps: number) => {
    const newPosition = Math.min(currentPlayer.position + steps, BOARD_SPACES.length - 1);
    const space = BOARD_SPACES[newPosition];
    
    setGameMessage(`${currentPlayer.name} moves ${steps} spaces!`);
    
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex].position = newPosition;
    setPlayers(updatedPlayers);

    setTimeout(() => {
      if (space.type === "challenge") {
        const randomChallenge = CHALLENGE_CARDS[Math.floor(Math.random() * CHALLENGE_CARDS.length)];
        setCurrentChallenge(randomChallenge);
        setCardType("challenge");
        setShowCard(true);
        setTotalQuestions(prev => prev + 1);
      } else if (space.type === "fact") {
        const randomFact = FUN_FACT_CARDS[Math.floor(Math.random() * FUN_FACT_CARDS.length)];
        setCurrentFact(randomFact);
        setCardType("fact");
        setShowCard(true);
      } else if (space.type === "bonus") {
        setCardType("bonus");
        setShowCard(true);
      } else if (space.type === "finish") {
        endGame();
      } else {
        nextTurn();
      }
    }, 800);
  };

  const handleCardAction = (success: boolean) => {
    setShowCard(false);
    
    if (cardType === "challenge" && success) {
      const updatedPlayers = [...players];
      updatedPlayers[currentPlayerIndex].score += 1;
      setPlayers(updatedPlayers);
      setGameMessage(`🎉 Correct! ${currentPlayer.name} earns a Nutrition Point!`);
      triggerConfetti();
    } else if (cardType === "challenge") {
      setGameMessage(`Nice try, ${currentPlayer.name}! Keep learning!`);
    } else if (cardType === "bonus") {
      const updatedPlayers = [...players];
      updatedPlayers[currentPlayerIndex].score += 2;
      setPlayers(updatedPlayers);
      setGameMessage(`⭐ Bonus! ${currentPlayer.name} earns 2 Nutrition Points!`);
      triggerConfetti();
    }
    
    setTimeout(nextTurn, 1200);
  };

  const nextTurn = () => {
    const nextIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextIndex);
    setGameMessage(`${players[nextIndex].name}'s turn! Roll the dice!`);
  };

  const endGame = () => {
    setGameState("finished");
    const winner = [...players].sort((a, b) => b.score - a.score)[0];
    setGameMessage(`🏆 ${winner.name} wins with ${winner.score} Nutrition Points!`);
    triggerConfetti();
    
    // Save all player scores
    players.forEach(player => {
      saveScoreMutation.mutate({
        playerName: player.name,
        score: player.score,
        totalQuestions,
        correctAnswers: player.score,
      });
    });
  };

  const resetGame = () => {
    setGameState("setup");
    setPlayers([]);
    setPlayerNames(["", ""]);
    setCurrentPlayerIndex(0);
    setDiceValue(1);
    setTotalQuestions(0);
    setGameMessage("");
  };

  // Setup Screen
  if (gameState === "setup") {
    return (
      <div className="relative w-full max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-8 shadow-2xl border-4 border-[#8b5a2b]"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-['Chango'] text-primary mb-2">Ready to Explore?</h2>
            <p className="text-muted-foreground">Enter player names and choose your characters!</p>
          </div>

          <div className="space-y-6">
            {[0, 1].map((playerIndex) => (
              <div key={playerIndex} className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="flex gap-2">
                  {AVATARS.map((avatar, avatarIndex) => (
                    <button
                      key={avatar.id}
                      onClick={() => {
                        const newSelected = [...selectedAvatars];
                        newSelected[playerIndex] = avatarIndex;
                        setSelectedAvatars(newSelected);
                      }}
                      className={cn(
                        "w-14 h-14 rounded-full p-1 transition-all",
                        selectedAvatars[playerIndex] === avatarIndex 
                          ? "ring-4 ring-primary scale-110" 
                          : "opacity-50 hover:opacity-100"
                      )}
                    >
                      <img src={avatar.src} alt={avatar.name} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
                <Input
                  placeholder={`Player ${playerIndex + 1} name`}
                  value={playerNames[playerIndex]}
                  onChange={(e) => {
                    const newNames = [...playerNames];
                    newNames[playerIndex] = e.target.value;
                    setPlayerNames(newNames);
                  }}
                  className="flex-1 text-lg h-12"
                />
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-4">
            <Button 
              size="lg" 
              onClick={startGame}
              className="flex-1 h-14 text-xl font-['Chango'] bg-primary hover:bg-primary/90"
            >
              <Play className="mr-2 h-6 w-6" />
              Start Adventure!
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => setShowLeaderboard(true)}
              className="h-14"
            >
              <Trophy className="h-6 w-6" />
            </Button>
          </div>

          {/* Mini Leaderboard Preview */}
          {leaderboard && leaderboard.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-5 w-5 text-yellow-600" />
                <span className="font-bold text-yellow-800">Top Explorers</span>
              </div>
              <div className="space-y-1">
                {leaderboard.slice(0, 3).map((entry, i) => (
                  <div key={entry.id} className="flex justify-between text-sm">
                    <span className="font-medium">{i + 1}. {entry.playerName}</span>
                    <span className="text-yellow-700">{entry.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // Game Board
  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Sound Toggle */}
      <button 
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-2 right-2 z-20 p-2 bg-white/80 rounded-full shadow-md hover:bg-white transition-colors"
      >
        {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </button>

      {/* Game Board */}
      <div className="relative w-full aspect-[4/3] bg-[#fdf6e3] rounded-2xl overflow-hidden shadow-2xl border-8 border-[#8b5a2b]">
        {/* Map Background */}
        <div 
          className="absolute inset-0"
          style={{ 
            backgroundImage: "url('/images/wisconsin-map-background.png')", 
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />

        {/* Board Spaces */}
        {BOARD_SPACES.map((space) => (
          <motion.div
            key={space.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: space.id * 0.05 }}
            className={cn(
              "absolute w-10 h-10 -ml-5 -mt-5 rounded-full border-3 border-white shadow-lg flex items-center justify-center text-xs font-bold transition-transform hover:scale-110",
              space.type === "start" ? "bg-green-500 text-white w-14 h-14 -ml-7 -mt-7" :
              space.type === "finish" ? "bg-yellow-500 text-white w-14 h-14 -ml-7 -mt-7" :
              space.type === "challenge" ? "bg-orange-500 text-white" :
              space.type === "bonus" ? "bg-purple-500 text-white" :
              space.type === "fact" ? "bg-blue-400 text-white" : "bg-gray-300"
            )}
            style={{ left: `${space.x}%`, top: `${space.y}%` }}
          >
            {space.type === "start" ? "GO!" : 
             space.type === "finish" ? "🏆" : 
             space.type === "bonus" ? "⭐" : space.id}
          </motion.div>
        ))}

        {/* Players */}
        <AnimatePresence>
          {players.map((player, index) => {
            const space = BOARD_SPACES[player.position];
            const offset = (index - (players.filter(p => p.position === player.position).length - 1) / 2) * 25;
            
            return (
              <motion.div
                key={player.id}
                initial={{ scale: 0 }}
                animate={{ 
                  left: `calc(${space.x}% + ${offset}px)`, 
                  top: `calc(${space.y}% - 25px)`,
                  scale: currentPlayerIndex === index ? 1.2 : 1,
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className={cn(
                  "absolute w-14 h-14 -ml-7 -mt-7 z-10 drop-shadow-xl",
                  currentPlayerIndex === index && "animate-bounce"
                )}
              >
                <img src={player.avatar} alt={player.name} className="w-full h-full object-contain" />
                <div className={cn(
                  "absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full text-white font-bold whitespace-nowrap shadow-md",
                  player.color
                )}>
                  {player.name}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Controls Panel */}
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mt-4 p-4 bg-white rounded-xl shadow-lg border-2 border-[#8b5a2b]"
      >
        <div className="flex items-center justify-between gap-4">
          {/* Current Player & Message */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              {currentPlayer && (
                <img src={currentPlayer.avatar} alt="" className="w-10 h-10" />
              )}
              <div>
                <div className="text-sm text-muted-foreground">Current Turn</div>
                <div className="text-xl font-['Chango'] text-primary">{currentPlayer?.name}</div>
              </div>
            </div>
            <p className="text-sm font-medium text-foreground/80">{gameMessage}</p>
          </div>

          {/* Scores */}
          <div className="flex gap-2">
            {players.map(p => (
              <div key={p.id} className={cn(
                "flex flex-col items-center px-3 py-2 rounded-lg text-white",
                p.color
              )}>
                <span className="text-xs font-medium">{p.name}</span>
                <span className="text-2xl font-bold">{p.score}</span>
              </div>
            ))}
          </div>

          {/* Dice Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              size="lg" 
              onClick={gameState === "finished" ? resetGame : handleRollDice} 
              disabled={isRolling || showCard}
              className={cn(
                "h-20 w-28 text-2xl font-['Chango'] shadow-lg transition-all",
                gameState === "finished" 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-primary hover:bg-primary/90"
              )}
            >
              {gameState === "finished" ? (
                <RotateCcw className="h-8 w-8" />
              ) : isRolling ? (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.3 }}
                >
                  🎲
                </motion.span>
              ) : (
                <span className="flex flex-col items-center">
                  <span className="text-3xl">🎲</span>
                  <span className="text-sm">{diceValue}</span>
                </span>
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Card Dialog */}
      <Dialog open={showCard} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-lg bg-[#fdf6e3] border-4 border-[#8b5a2b] p-0 overflow-hidden">
          <div className={cn(
            "p-6",
            cardType === "challenge" ? "bg-gradient-to-b from-orange-100 to-transparent" :
            cardType === "bonus" ? "bg-gradient-to-b from-purple-100 to-transparent" :
            "bg-gradient-to-b from-blue-100 to-transparent"
          )}>
            <DialogHeader>
              <DialogTitle className="text-3xl text-center font-['Chango']">
                {cardType === "challenge" && (
                  <span className="text-orange-600 flex items-center justify-center gap-2">
                    <Sparkles className="h-8 w-8" />
                    Challenge!
                    <Sparkles className="h-8 w-8" />
                  </span>
                )}
                {cardType === "fact" && (
                  <span className="text-blue-600 flex items-center justify-center gap-2">
                    <Star className="h-8 w-8" />
                    Fun Fact!
                    <Star className="h-8 w-8" />
                  </span>
                )}
                {cardType === "bonus" && (
                  <span className="text-purple-600 flex items-center justify-center gap-2">
                    <Trophy className="h-8 w-8" />
                    Bonus Space!
                    <Trophy className="h-8 w-8" />
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-8 text-center">
              {cardType === "challenge" && currentChallenge && (
                <div className="space-y-4">
                  <div className={cn(
                    "inline-block px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider",
                    currentChallenge.type === "activity" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  )}>
                    {currentChallenge.type === "activity" ? "🏃 Activity" : "❓ Question"}
                  </div>
                  <p className="text-xl font-medium leading-relaxed">{currentChallenge.question}</p>
                  {currentChallenge.answer && (
                    <div className="mt-6 p-4 bg-white/70 rounded-lg border border-orange-200">
                      <p className="text-sm text-muted-foreground italic">
                        <span className="font-bold">Answer:</span> {currentChallenge.answer}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {cardType === "fact" && currentFact && (
                <div className="space-y-4">
                  <div className="text-6xl mb-4">🧠</div>
                  <p className="text-xl font-medium italic leading-relaxed">
                    "{currentFact.fact}"
                  </p>
                </div>
              )}
              
              {cardType === "bonus" && (
                <div className="space-y-4">
                  <div className="text-6xl mb-4">🌟</div>
                  <p className="text-xl font-medium">
                    You landed on a Bonus Space!<br />
                    <span className="text-purple-600 font-bold">+2 Nutrition Points!</span>
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter className="justify-center gap-3 pb-2">
              {cardType === "challenge" ? (
                <>
                  <Button 
                    size="lg"
                    variant="outline" 
                    onClick={() => handleCardAction(false)} 
                    className="border-2 border-red-400 text-red-600 hover:bg-red-50 px-8"
                  >
                    ❌ Incorrect
                  </Button>
                  <Button 
                    size="lg"
                    onClick={() => handleCardAction(true)} 
                    className="bg-green-600 hover:bg-green-700 text-white px-8"
                  >
                    ✅ Correct!
                  </Button>
                </>
              ) : (
                <Button 
                  size="lg"
                  onClick={() => handleCardAction(true)} 
                  className={cn(
                    "px-12",
                    cardType === "bonus" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  {cardType === "bonus" ? "Collect Points! 🎉" : "Awesome! 👍"}
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
