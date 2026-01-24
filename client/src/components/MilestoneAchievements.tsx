import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Sparkles, Trophy, Star, Flame, Target } from "lucide-react";

interface Achievement {
  id: number;
  type: "goal_completed" | "streak" | "milestone" | "badge" | "perfect_score";
  title: string;
  description: string;
  earnedDate: string;
  icon?: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
}

interface MilestoneAchievementsProps {
  achievements: Achievement[];
}

export default function MilestoneAchievements({
  achievements,
}: MilestoneAchievementsProps) {
  const achievementIcons: Record<string, string> = {
    goal_completed: "🎯",
    streak: "🔥",
    milestone: "🏆",
    badge: "🏅",
    perfect_score: "⭐",
  };

  const rarityColors: Record<string, string> = {
    common: "bg-gray-100 text-gray-800 border-gray-300",
    rare: "bg-blue-100 text-blue-800 border-blue-300",
    epic: "bg-purple-100 text-purple-800 border-purple-300",
    legendary: "bg-yellow-100 text-yellow-800 border-yellow-300",
  };

  const sortedAchievements = [...achievements].sort(
    (a, b) =>
      new Date(b.earnedDate).getTime() - new Date(a.earnedDate).getTime()
  );

  // Group achievements by type
  const groupedAchievements = achievements.reduce(
    (acc: Record<string, Achievement[]>, achievement) => {
      if (!acc[achievement.type]) {
        acc[achievement.type] = [];
      }
      acc[achievement.type].push(achievement);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Achievement Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Total Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {achievements.length}
            </div>
            <p className="text-xs text-gray-600 mt-1">Unlocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Goals Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {groupedAchievements["goal_completed"]?.length || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">Finished goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Streaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {groupedAchievements["streak"]?.length || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">Active streaks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Perfect Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {groupedAchievements["perfect_score"]?.length || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">100% accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Achievements */}
      {sortedAchievements.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedAchievements.slice(0, 10).map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border-2 ${
                    rarityColors[achievement.rarity || "common"]
                  } transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">
                      {achievement.icon ||
                        achievementIcons[achievement.type] ||
                        "🏆"}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-gray-700 mt-1">
                        {achievement.description}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        Earned on{" "}
                        {new Date(achievement.earnedDate).toLocaleDateString()}
                      </p>
                    </div>
                    {achievement.rarity && (
                      <Badge className={rarityColors[achievement.rarity]}>
                        {achievement.rarity.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Award className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">No achievements yet</p>
              <p className="text-sm text-gray-500">
                Complete goals and reach milestones to earn achievements!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Showcase */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Achievement Showcase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sortedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
                  title={achievement.title}
                >
                  <div className="text-4xl group-hover:scale-110 transition-transform">
                    {achievement.icon ||
                      achievementIcons[achievement.type] ||
                      "🏆"}
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center line-clamp-2">
                    {achievement.title}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
