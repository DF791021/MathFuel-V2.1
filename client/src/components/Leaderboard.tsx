import { trpc } from "@/lib/trpc";
import { Trophy, Medal, Award, Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Leaderboard() {
  const { data: scores, isLoading } = trpc.game.getLeaderboard.useQuery({ limit: 10 });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  if (!scores || scores.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">No scores yet. Be the first to play!</p>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300";
      case 2:
        return "bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300";
      case 3:
        return "bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300";
      default:
        return "bg-white border-border";
    }
  };

  return (
    <div className="space-y-3">
      {scores.map((score, index) => (
        <motion.div
          key={score.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={cn(
            "flex items-center gap-4 p-4 rounded-xl border-2 transition-transform hover:scale-[1.02]",
            getRankBg(index + 1)
          )}
        >
          <div className="flex items-center justify-center w-10">
            {getRankIcon(index + 1)}
          </div>
          
          <div className="flex-1">
            <div className="font-bold text-lg">{score.playerName}</div>
            <div className="text-sm text-muted-foreground">
              {score.correctAnswers}/{score.totalQuestions} correct
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="text-2xl font-['Chango'] text-primary">{score.score}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
