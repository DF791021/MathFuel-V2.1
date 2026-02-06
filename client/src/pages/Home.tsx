import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { 
  Play, Trophy, GraduationCap, Users, Sparkles, 
  ChevronRight, Star, Zap, Brain, Target, BarChart3
} from "lucide-react";
import GameBoard from "@/components/GameBoard";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { data: leaderboard } = trpc.game.getLeaderboard.useQuery({ limit: 3 });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-indigo-50">
      {/* Floating Math Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute top-20 left-10 text-6xl opacity-20"
        >
          ∑
        </motion.div>
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute top-40 right-20 text-5xl opacity-20"
        >
          π
        </motion.div>
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity, delay: 2 }}
          className="absolute bottom-40 left-20 text-5xl opacity-20"
        >
          √
        </motion.div>
        <motion.div
          animate={{ y: [0, 20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, delay: 0.5 }}
          className="absolute bottom-20 right-10 text-6xl opacity-20"
        >
          ∞
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-white/90 backdrop-blur-sm border-b-2 border-primary shadow-md sticky top-0">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-primary hidden sm:block">
              MathMastery
            </span>
            <span className="text-lg sm:hidden font-bold text-primary">
              Math
            </span>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm" className="gap-2 text-xs sm:text-sm">
                <Trophy className="h-4 w-4 text-orange-500" />
                <span className="hidden sm:inline">Leaderboard</span>
              </Button>
            </Link>
            <Link href="/teacher">
              <Button variant="ghost" size="sm" className="gap-2 text-xs sm:text-sm">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="hidden sm:inline">Teachers</span>
              </Button>
            </Link>
            {isAuthenticated && user?.role !== 'admin' && (
              <Link href="/goals">
                <Button variant="ghost" size="sm" className="gap-2 text-xs sm:text-sm">
                  <Target className="h-4 w-4 text-blue-500" />
                  <span className="hidden sm:inline">Goals</span>
                </Button>
              </Link>
            )}
            {isAuthenticated ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/";
                }}
                className="text-xs sm:text-sm"
              >
                Logout
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={() => window.location.href = getLoginUrl()}
                className="text-xs sm:text-sm"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-5 container py-8 sm:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl sm:text-5xl font-bold text-primary mb-4">
            Master Math Through Adventure
          </h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 px-4">
            Engage students with adaptive math challenges that make learning irresistible. 
            Track progress, celebrate achievements, and build mathematical confidence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <Link href="/roulette">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <Play className="h-5 w-5" />
                  Start Learning
                </Button>
              </Link>
            ) : (
              <Button 
                size="lg" 
                onClick={() => window.location.href = getLoginUrl()}
                className="gap-2 w-full sm:w-auto"
              >
                <Play className="h-5 w-5" />
                Get Started Free
              </Button>
            )}
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="gap-2 w-full sm:w-auto">
                <span>View Pricing</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Zap className="h-12 w-12 text-orange-500 mb-4 mx-auto" />
                <h3 className="font-bold text-lg mb-2">Adaptive Learning</h3>
                <p className="text-sm text-gray-600">
                  Challenges adjust to student level for optimal engagement and growth
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Trophy className="h-12 w-12 text-yellow-500 mb-4 mx-auto" />
                <h3 className="font-bold text-lg mb-2">Gamification</h3>
                <p className="text-sm text-gray-600">
                  Leaderboards, badges, and rewards keep students motivated
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <BarChart3 className="h-12 w-12 text-primary mb-4 mx-auto" />
                <h3 className="font-bold text-lg mb-2">Teacher Analytics</h3>
                <p className="text-sm text-gray-600">
                  Real-time insights into student progress and learning gaps
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      {leaderboard && leaderboard.length > 0 && (
        <section className="container py-12 sm:py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            Top Performers
          </h2>
          <div className="max-w-2xl mx-auto">
            <div className="space-y-3">
              {leaderboard.map((entry, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="text-2xl font-bold text-primary w-10 text-center">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{entry.playerName}</p>
                    <p className="text-sm text-gray-500">Grade {entry.gradeLevel}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">{entry.score}</p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="container py-12 sm:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="bg-gradient-to-r from-primary to-purple-600 rounded-lg p-8 sm:p-12 text-white"
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Transform Math Learning?
          </h2>
          <p className="text-base sm:text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of teachers using MathMastery to inspire students and boost achievement
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.location.href = getLoginUrl()}
            className="gap-2"
          >
            <Sparkles className="h-5 w-5" />
            Start Your Free Trial
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16 sm:mt-20">
        <div className="container py-8 text-center text-sm text-gray-600">
          <p>&copy; 2026 MathMastery. Making math education engaging and effective.</p>
        </div>
      </footer>
    </div>
  );
}
