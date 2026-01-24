import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Trophy,
  Star,
  Zap,
  Heart,
  Award,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  User,
} from "lucide-react";

interface GoalAchievementNotificationsProps {
  teacherId?: number;
  limit?: number;
}

export default function GoalAchievementNotifications({
  teacherId,
  limit = 10,
}: GoalAchievementNotificationsProps) {
  const [displayedAchievements, setDisplayedAchievements] = useState<any[]>([]);
  const [celebratingId, setCelebratingId] = useState<number | null>(null);

  // Fetch class achievements
  const { data: achievements, isLoading } = trpc.goals.getClassAchievements.useQuery({
    limit,
  });

  useEffect(() => {
    if (achievements) {
      setDisplayedAchievements(achievements);
    }
  }, [achievements]);

  const getAchievementIcon = (goalName: string) => {
    if (goalName.toLowerCase().includes("accuracy"))
      return <Target className="w-6 h-6 text-blue-600" />;
    if (goalName.toLowerCase().includes("score"))
      return <TrendingUp className="w-6 h-6 text-green-600" />;
    if (goalName.toLowerCase().includes("games"))
      return <Flame className="w-6 h-6 text-orange-600" />;
    if (goalName.toLowerCase().includes("streak"))
      return <Zap className="w-6 h-6 text-yellow-600" />;
    if (goalName.toLowerCase().includes("mastery"))
      return <Star className="w-6 h-6 text-purple-600" />;
    return <Award className="w-6 h-6 text-indigo-600" />;
  };

  const getCelebrationMessage = (goalName: string, playerName: string) => {
    const messages = [
      `🎉 ${playerName} crushed their goal: ${goalName}!`,
      `⭐ Fantastic work! ${playerName} achieved: ${goalName}`,
      `🏆 Amazing! ${playerName} completed: ${goalName}`,
      `🌟 Incredible effort! ${playerName} reached: ${goalName}`,
      `💪 Awesome! ${playerName} succeeded at: ${goalName}`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const handleCelebrate = (achievementId: number) => {
    setCelebratingId(achievementId);
    const achievement = displayedAchievements.find((a) => a.id === achievementId);
    if (achievement) {
      toast.success(
        getCelebrationMessage(achievement.goalName, achievement.playerName),
        {
          duration: 4000,
          icon: "🎊",
        }
      );
    }
    setTimeout(() => setCelebratingId(null), 600);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Recent Goal Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!displayedAchievements || displayedAchievements.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Recent Goal Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600">No goal achievements yet</p>
            <p className="text-sm text-gray-500 mt-2">
              When students complete their goals, they'll appear here!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-900">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Recent Goal Achievements
        </CardTitle>
        <p className="text-sm text-yellow-800 mt-2">
          Celebrating student success and goal completions
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedAchievements.map((achievement, index) => {
            const daysToComplete = achievement.daysToComplete || 0;
            const speedBadge =
              daysToComplete <= 7
                ? { label: "Lightning Fast", color: "bg-red-600" }
                : daysToComplete <= 14
                ? { label: "Quick Work", color: "bg-orange-600" }
                : { label: "Steady Progress", color: "bg-blue-600" };

            return (
              <div
                key={achievement.id}
                className={`p-4 bg-white rounded-lg border-2 border-yellow-200 transition transform ${
                  celebratingId === achievement.id
                    ? "scale-105 shadow-lg"
                    : "hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 pt-1">
                    {getAchievementIcon(achievement.goalName)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-600" />
                          {achievement.playerName}
                        </h4>
                        <p className="text-sm text-gray-700 mt-1 font-medium">
                          ✓ {achievement.goalName}
                        </p>
                      </div>
                      <Badge className={`${speedBadge.color} text-white`}>
                        {speedBadge.label}
                      </Badge>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                      <div className="bg-blue-50 rounded p-2">
                        <p className="text-gray-600">Achieved</p>
                        <p className="font-bold text-blue-600">
                          {new Date(achievement.achievedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-green-50 rounded p-2">
                        <p className="text-gray-600">Time to Complete</p>
                        <p className="font-bold text-green-600">
                          {daysToComplete} days
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded p-2">
                        <p className="text-gray-600">Reward Points</p>
                        <p className="font-bold text-yellow-600">
                          +{achievement.rewardPoints}
                        </p>
                      </div>
                    </div>

                    {/* Celebration Message */}
                    {achievement.celebrationMessage && (
                      <p className="text-sm text-gray-700 mt-3 italic border-l-4 border-yellow-400 pl-3">
                        "{achievement.celebrationMessage}"
                      </p>
                    )}
                  </div>

                  {/* Celebrate Button */}
                  <Button
                    onClick={() => handleCelebrate(achievement.id)}
                    disabled={celebratingId === achievement.id}
                    className="flex-shrink-0 bg-yellow-500 hover:bg-yellow-600 text-white"
                    size="sm"
                  >
                    {celebratingId === achievement.id ? (
                      <>
                        <Flame className="w-4 h-4 animate-bounce" />
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4 mr-1" />
                        Celebrate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-yellow-200 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {displayedAchievements.length}
            </p>
            <p className="text-xs text-gray-600">Achievements</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {displayedAchievements.reduce((sum, a) => sum + (a.rewardPoints || 0), 0)}
            </p>
            <p className="text-xs text-gray-600">Total Points</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {new Set(displayedAchievements.map((a) => a.playerName)).size}
            </p>
            <p className="text-xs text-gray-600">Students</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
