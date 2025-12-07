import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Award, Star, ArrowLeft, Crown, Flame } from "lucide-react";

export default function LeaderboardPage() {
  const { data: scores, isLoading } = trpc.game.getLeaderboard.useQuery({ limit: 50 });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-8 w-8 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Medal className="h-7 w-7 text-gray-400" />;
      case 3:
        return <Award className="h-7 w-7 text-amber-600" />;
      default:
        return (
          <span className="w-8 h-8 flex items-center justify-center text-lg font-bold text-muted-foreground">
            {rank}
          </span>
        );
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-100 via-yellow-50 to-yellow-100 border-yellow-400 shadow-lg shadow-yellow-100";
      case 2:
        return "bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 border-gray-300";
      case 3:
        return "bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 border-amber-400";
      default:
        return "bg-white border-border hover:border-primary/30";
    }
  };

  return (
    <div className="min-h-screen bg-[#f0e6d2]">
      {/* Header */}
      <header className="bg-white border-b-4 border-[#8b5a2b] shadow-md">
        <div className="container py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Game
              </Button>
            </Link>
          </div>
          <div className="text-center mt-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy className="h-10 w-10 text-yellow-500" />
              <h1 className="text-4xl font-['Chango'] text-primary">Hall of Fame</h1>
              <Trophy className="h-10 w-10 text-yellow-500" />
            </div>
            <p className="text-muted-foreground">Wisconsin's Top Nutrition Explorers</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8 max-w-3xl">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-20 bg-white/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !scores || scores.length === 0 ? (
          <Card className="border-4 border-[#8b5a2b]">
            <CardContent className="py-16 text-center">
              <Trophy className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
              <h2 className="text-2xl font-['Chango'] text-muted-foreground mb-2">No Explorers Yet!</h2>
              <p className="text-muted-foreground mb-6">Be the first to play and claim the top spot!</p>
              <Button asChild size="lg">
                <Link href="/">Start Playing</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Top 3 Podium */}
            {scores.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="pt-8"
                >
                  <Card className="border-2 border-gray-300 bg-gradient-to-b from-gray-100 to-white text-center">
                    <CardContent className="pt-6 pb-4">
                      <Medal className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                      <p className="font-bold text-lg truncate">{scores[1]?.playerName}</p>
                      <p className="text-3xl font-['Chango'] text-gray-600">{scores[1]?.score}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* 1st Place */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="border-4 border-yellow-400 bg-gradient-to-b from-yellow-100 to-white text-center shadow-xl shadow-yellow-100">
                    <CardContent className="pt-6 pb-4">
                      <div className="relative">
                        <Crown className="h-12 w-12 mx-auto text-yellow-500 fill-yellow-500 mb-2" />
                        <Flame className="h-6 w-6 absolute -top-2 -right-2 text-orange-500 animate-pulse" />
                      </div>
                      <p className="font-bold text-xl truncate">{scores[0]?.playerName}</p>
                      <p className="text-4xl font-['Chango'] text-yellow-600">{scores[0]?.score}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* 3rd Place */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-12"
                >
                  <Card className="border-2 border-amber-400 bg-gradient-to-b from-amber-100 to-white text-center">
                    <CardContent className="pt-6 pb-4">
                      <Award className="h-9 w-9 mx-auto text-amber-600 mb-2" />
                      <p className="font-bold truncate">{scores[2]?.playerName}</p>
                      <p className="text-2xl font-['Chango'] text-amber-700">{scores[2]?.score}</p>
                      <p className="text-xs text-muted-foreground">points</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Rest of the leaderboard */}
            {scores.slice(3).map((score, index) => (
              <motion.div
                key={score.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                  getRankStyle(index + 4)
                )}
              >
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(index + 4)}
                </div>
                
                <div className="flex-1">
                  <div className="font-bold text-lg">{score.playerName}</div>
                  <div className="text-sm text-muted-foreground">
                    {score.correctAnswers}/{score.totalQuestions} correct answers
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <span className="text-2xl font-['Chango'] text-primary">{score.score}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
