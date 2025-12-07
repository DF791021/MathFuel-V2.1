import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CHALLENGE_CARDS, FUN_FACT_CARDS, ChallengeCard, FunFactCard } from "@/lib/gameData";

// Game types
type Player = {
  id: number;
  name: string;
  avatar: string;
  position: number;
  score: number;
  color: string;
};

type SpaceType = "start" | "challenge" | "fact" | "finish" | "empty";

type Space = {
  id: number;
  type: SpaceType;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
};

// Mock data for the board path (simplified S-curve for now)
const BOARD_SPACES: Space[] = [
  { id: 0, type: "start", x: 50, y: 90 },
  { id: 1, type: "challenge", x: 30, y: 85 },
  { id: 2, type: "fact", x: 15, y: 75 },
  { id: 3, type: "challenge", x: 20, y: 60 },
  { id: 4, type: "challenge", x: 40, y: 55 },
  { id: 5, type: "fact", x: 60, y: 50 },
  { id: 6, type: "challenge", x: 80, y: 45 },
  { id: 7, type: "challenge", x: 85, y: 30 },
  { id: 8, type: "fact", x: 70, y: 20 },
  { id: 9, type: "challenge", x: 50, y: 15 },
  { id: 10, type: "finish", x: 50, y: 5 },
];

const PLAYERS_MOCK: Player[] = [
  { id: 1, name: "Cheddar", avatar: "/images/cheese-wedge-piece.png", position: 0, score: 0, color: "bg-yellow-400" },
  { id: 2, name: "Berry", avatar: "/images/cranberry-piece.png", position: 0, score: 0, color: "bg-red-500" },
];

export default function GameBoard() {
  const [players, setPlayers] = useState<Player[]>(PLAYERS_MOCK);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [diceValue, setDiceValue] = useState(1);
  const [showCard, setShowCard] = useState(false);
  const [cardType, setCardType] = useState<"challenge" | "fact" | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<ChallengeCard | null>(null);
  const [currentFact, setCurrentFact] = useState<FunFactCard | null>(null);
  const [gameMessage, setGameMessage] = useState("Welcome to Wisconsin Food Explorer!");

  const currentPlayer = players[currentPlayerIndex];

  const handleRollDice = () => {
    if (isRolling) return;
    setIsRolling(true);
    
    // Simulate dice roll animation
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 10) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        movePlayer(finalRoll);
      }
    }, 100);
  };

  const movePlayer = (steps: number) => {
    const newPosition = Math.min(currentPlayer.position + steps, BOARD_SPACES.length - 1);
    const space = BOARD_SPACES[newPosition];
    
    setGameMessage(`${currentPlayer.name} moves to space ${newPosition}!`);
    
    // Update player position
    const updatedPlayers = [...players];
    updatedPlayers[currentPlayerIndex].position = newPosition;
    setPlayers(updatedPlayers);

    // Handle space event
    setTimeout(() => {
      if (space.type === "challenge") {
        const randomChallenge = CHALLENGE_CARDS[Math.floor(Math.random() * CHALLENGE_CARDS.length)];
        setCurrentChallenge(randomChallenge);
        setCardType("challenge");
        setShowCard(true);
      } else if (space.type === "fact") {
        const randomFact = FUN_FACT_CARDS[Math.floor(Math.random() * FUN_FACT_CARDS.length)];
        setCurrentFact(randomFact);
        setCardType("fact");
        setShowCard(true);
      } else if (space.type === "finish") {
        setGameMessage(`${currentPlayer.name} wins the game!`);
      } else {
        nextTurn();
      }
    }, 1000);
  };

  const handleCardAction = (success: boolean) => {
    setShowCard(false);
    if (success && cardType === "challenge") {
      const updatedPlayers = [...players];
      updatedPlayers[currentPlayerIndex].score += 1;
      setPlayers(updatedPlayers);
      setGameMessage("Correct! +1 Nutrition Point!");
    } else if (cardType === "challenge") {
      setGameMessage("Nice try! Maybe next time.");
    }
    setTimeout(nextTurn, 1500);
  };

  const nextTurn = () => {
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
    setGameMessage(`It's ${players[(currentPlayerIndex + 1) % players.length].name}'s turn!`);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[80vh] bg-[#fdf6e3] rounded-xl overflow-hidden shadow-2xl border-8 border-[#8b5a2b]">
      {/* Map Background */}
      <div 
        className="absolute inset-0 opacity-80"
        style={{ 
          backgroundImage: "url('/images/wisconsin-map-background.png')", 
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />

      {/* Path and Spaces */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path 
          d="M 50% 90% Q 30% 85% 15% 75% T 20% 60% T 40% 55% T 60% 50% T 80% 45% T 85% 30% T 70% 20% T 50% 15% T 50% 5%" 
          fill="none" 
          stroke="#8b5a2b" 
          strokeWidth="4" 
          strokeDasharray="10,5"
          className="opacity-60"
        />
      </svg>

      {BOARD_SPACES.map((space) => (
        <div
          key={space.id}
          className={cn(
            "absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-2 border-white shadow-md flex items-center justify-center text-xs font-bold",
            space.type === "start" ? "bg-green-500 text-white w-12 h-12 -ml-6 -mt-6" :
            space.type === "finish" ? "bg-yellow-500 text-white w-12 h-12 -ml-6 -mt-6" :
            space.type === "challenge" ? "bg-orange-500 text-white" :
            space.type === "fact" ? "bg-blue-400 text-white" : "bg-gray-300"
          )}
          style={{ left: `${space.x}%`, top: `${space.y}%` }}
        >
          {space.type === "start" ? "Start" : space.type === "finish" ? "End" : space.id}
        </div>
      ))}

      {/* Players */}
      <AnimatePresence>
        {players.map((player, index) => {
          const space = BOARD_SPACES[player.position];
          // Offset players slightly if on same space
          const offset = (index - (players.filter(p => p.position === player.position).length - 1) / 2) * 20;
          
          return (
            <motion.div
              key={player.id}
              initial={{ scale: 0 }}
              animate={{ 
                left: `calc(${space.x}% + ${offset}px)`, 
                top: `calc(${space.y}% - 20px)`,
                scale: 1 
              }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute w-12 h-12 -ml-6 -mt-6 z-10 drop-shadow-lg"
            >
              <img src={player.avatar} alt={player.name} className="w-full h-full object-contain" />
              <div className={cn("absolute -bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-1 rounded text-white font-bold whitespace-nowrap", player.color)}>
                {player.name}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* UI Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-sm border-t-4 border-[#8b5a2b] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-sm font-bold text-muted-foreground">Current Turn</div>
            <div className="text-xl font-['Chango'] text-primary">{currentPlayer.name}</div>
          </div>
          <div className="h-10 w-[1px] bg-border" />
          <div className="text-sm font-medium">{gameMessage}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
             <div className="text-xs font-bold mb-1">Score</div>
             <div className="flex gap-2">
               {players.map(p => (
                 <div key={p.id} className={cn("px-2 py-1 rounded text-white text-xs font-bold", p.color)}>
                   {p.score}
                 </div>
               ))}
             </div>
          </div>
          
          <Button 
            size="lg" 
            onClick={handleRollDice} 
            disabled={isRolling || showCard}
            className="bg-primary hover:bg-primary/90 text-white font-['Chango'] text-lg h-16 w-32 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px] transition-all"
          >
            {isRolling ? "Rolling..." : `Roll: ${diceValue}`}
          </Button>
        </div>
      </div>

      {/* Card Dialog */}
      <Dialog open={showCard} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md bg-[#fdf6e3] border-4 border-[#8b5a2b]">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center text-[#8b5a2b]">
              {cardType === "challenge" ? "Challenge!" : "Fun Fact!"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-lg font-medium">
            {cardType === "challenge" && currentChallenge ? (
              <div className="space-y-4">
                <div className="text-sm uppercase tracking-widest text-muted-foreground font-bold">
                  {currentChallenge.type === "activity" ? "Physical Activity!" : "Question"}
                </div>
                <div className="text-xl">{currentChallenge.question}</div>
                {currentChallenge.answer && (
                  <div className="text-sm text-muted-foreground italic mt-4 bg-white/50 p-2 rounded">
                    (Answer: {currentChallenge.answer})
                  </div>
                )}
              </div>
            ) : cardType === "fact" && currentFact ? (
              <div className="text-xl italic">
                "{currentFact.fact}"
              </div>
            ) : null}
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            {cardType === "challenge" ? (
              <>
                <Button variant="outline" onClick={() => handleCardAction(false)} className="border-red-500 text-red-500 hover:bg-red-50">Incorrect</Button>
                <Button onClick={() => handleCardAction(true)} className="bg-green-600 hover:bg-green-700 text-white">Correct!</Button>
              </>
            ) : (
              <Button onClick={() => handleCardAction(true)} className="bg-blue-500 hover:bg-blue-600 text-white">Awesome!</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
