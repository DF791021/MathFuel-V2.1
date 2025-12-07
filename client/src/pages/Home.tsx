import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Play, Trophy, GraduationCap, Users, Sparkles, 
  ChevronRight, Star, Leaf, Apple, Carrot
} from "lucide-react";
import GameBoard from "@/components/GameBoard";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: leaderboard } = trpc.game.getLeaderboard.useQuery({ limit: 3 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0e6d2] via-[#f5edd8] to-[#e8dcc4]">
      {/* Floating Food Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-20 left-10 text-6xl opacity-20"
        >
          🧀
        </motion.div>
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute top-40 right-20 text-5xl opacity-20"
        >
          🍎
        </motion.div>
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity, delay: 2 }}
          className="absolute bottom-40 left-20 text-5xl opacity-20"
        >
          🥕
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 0.5 }}
          className="absolute bottom-20 right-10 text-6xl opacity-20"
        >
          🌽
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-sm border-b-4 border-[#8b5a2b] shadow-md">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-['Chango'] text-primary hidden sm:block">
              Wisconsin Food Explorer
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Button>
            </Link>
            <Link href="/teacher">
              <Button variant="ghost" size="sm" className="gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Teachers</span>
              </Button>
            </Link>
            {isAuthenticated ? (
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                {user?.name || "Profile"}
              </Button>
            ) : (
              <Button asChild size="sm" className="gap-2">
                <a href={getLoginUrl()}>Sign In</a>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 container py-8 md:py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            <span className="text-sm font-bold uppercase tracking-widest text-primary/70">
              A Nutrition Adventure
            </span>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-['Chango'] text-[#8b5a2b] drop-shadow-sm mb-4">
            Wisconsin Food Explorer
          </h1>
          <p className="text-lg md:text-xl text-[#5c4033] max-w-2xl mx-auto mb-8">
            Learn about nutrition while exploring the great state of Wisconsin! 
            Perfect for elementary students, teachers, and anyone who loves healthy eating.
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-bold">60+ Challenge Cards</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
            <Apple className="h-5 w-5 text-red-500" />
            <span className="font-bold">6 Nutrition Topics</span>
          </div>
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-md">
            <Carrot className="h-5 w-5 text-orange-500" />
            <span className="font-bold">Wisconsin Fun Facts</span>
          </div>
        </motion.div>
      </header>

      {/* Game Section */}
      <main className="relative z-10 container pb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <GameBoard />
        </motion.div>
      </main>

      {/* Bottom Cards */}
      <section className="relative z-10 container pb-12">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Leaderboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="border-4 border-[#8b5a2b] h-full hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  <h3 className="text-lg font-['Chango'] text-primary">Top Explorers</h3>
                </div>
                {leaderboard && leaderboard.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {leaderboard.map((entry, i) => (
                      <div key={entry.id} className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {entry.playerName}
                        </span>
                        <span className="font-bold text-primary">{entry.score} pts</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">
                    No scores yet. Be the first!
                  </p>
                )}
                <Link href="/leaderboard">
                  <Button variant="outline" className="w-full gap-2">
                    View All Rankings
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* For Teachers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="border-4 border-[#8b5a2b] h-full hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-green-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-['Chango'] text-primary">For Teachers</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Create custom questions, manage classes, and track student progress with our Teacher Portal.
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Create custom questions
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Manage class rosters
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Track student scores
                  </li>
                </ul>
                <Link href="/teacher">
                  <Button className="w-full gap-2">
                    Teacher Portal
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* About the Game */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="border-4 border-[#8b5a2b] h-full hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Leaf className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-['Chango'] text-primary">About</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Wisconsin Food Explorer is aligned with the Wisconsin Standards for Nutrition Education, 
                  covering all six conceptual strands:
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Energy</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Safety</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Literacy</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Culture</span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Health</span>
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">Classification</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  © 2025 Wisconsin Department of Public Instruction
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
