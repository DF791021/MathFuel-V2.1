import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Heart, Lightbulb, Zap, TrendingUp } from "lucide-react";

interface Goal {
  id: number;
  goalName: string;
  goalType: string;
  progressPercentage: number;
  status: "active" | "completed" | "failed" | "paused";
  targetValue: number;
  currentValue: number;
  priority: "low" | "medium" | "high";
}

interface Achievement {
  [key: string]: any; // Allow any properties from database
}

interface EncouragementMessagesProps {
  goals: Goal[];
  achievements: any[];
  studentName: string;
}

export default function EncouragementMessages({
  goals,
  achievements,
  studentName,
}: EncouragementMessagesProps) {
  // Generate personalized messages based on progress
  const generateMessages = () => {
    const messages: Array<{
      type: "encouragement" | "tip" | "celebration" | "motivation" | "insight";
      title: string;
      message: string;
      icon: React.ReactNode;
    }> = [];

    // Overall progress message
    const avgProgress =
      goals.length > 0
        ? Math.round(
            goals.reduce((sum, g) => sum + g.progressPercentage, 0) / goals.length
          )
        : 0;

    if (avgProgress === 0) {
      messages.push({
        type: "motivation",
        title: "Get Started!",
        message: `Hi ${studentName}! You have ${goals.length} goal${goals.length !== 1 ? "s" : ""} waiting for you. Every journey starts with a single step. Let's make today count!`,
        icon: <Zap className="w-5 h-5 text-orange-500" />,
      });
    } else if (avgProgress < 25) {
      messages.push({
        type: "encouragement",
        title: "Great Start!",
        message: `You're off to a wonderful start, ${studentName}! You've made ${avgProgress}% progress. Keep pushing forward!`,
        icon: <Heart className="w-5 h-5 text-red-500" />,
      });
    } else if (avgProgress < 50) {
      messages.push({
        type: "encouragement",
        title: "Halfway There!",
        message: `Awesome work, ${studentName}! You're ${avgProgress}% of the way there. You're doing great!`,
        icon: <TrendingUp className="w-5 h-5 text-blue-500" />,
      });
    } else if (avgProgress < 100) {
      messages.push({
        type: "motivation",
        title: "Almost There!",
        message: `You're so close, ${studentName}! You've reached ${avgProgress}% progress. Just a little more effort to reach your goals!`,
        icon: <Sparkles className="w-5 h-5 text-purple-500" />,
      });
    }

    // Goal-specific messages
    const activeGoals = goals.filter((g) => g.status === "active");
    const completedGoals = goals.filter((g) => g.status === "completed");

    if (completedGoals.length > 0) {
      messages.push({
        type: "celebration",
        title: "🎉 Congratulations!",
        message: `You've completed ${completedGoals.length} goal${completedGoals.length !== 1 ? "s" : ""}! That's incredible, ${studentName}. You should be proud of yourself!`,
        icon: <Sparkles className="w-5 h-5 text-yellow-500" />,
      });
    }

    // High priority goals message
    const highPriorityGoals = activeGoals.filter((g) => g.priority === "high");
    if (highPriorityGoals.length > 0) {
      const highestProgress = Math.max(
        ...highPriorityGoals.map((g) => g.progressPercentage)
      );
      messages.push({
        type: "tip",
        title: "Focus on High Priority Goals",
        message: `You have ${highPriorityGoals.length} high-priority goal${highPriorityGoals.length !== 1 ? "s" : ""}. Your best progress on these is ${highestProgress}%. Consider dedicating extra time to these important targets!`,
        icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      });
    }

    // Consistency message
    if (activeGoals.length > 0) {
      const consistentGoals = activeGoals.filter((g) => g.progressPercentage > 0);
      if (consistentGoals.length === activeGoals.length) {
        messages.push({
          type: "celebration",
          title: "Perfect Consistency!",
          message: `Amazing dedication, ${studentName}! You're making progress on every single goal. This consistency will lead to great results!`,
          icon: <Zap className="w-5 h-5 text-green-500" />,
        });
      }
    }

    // Lagging goals message
    const lagginGoals = activeGoals.filter((g) => g.progressPercentage === 0);
    if (lagginGoals.length > 0 && activeGoals.length > 0) {
      messages.push({
        type: "tip",
        title: "Get Started on These Goals",
        message: `${studentName}, you haven't started ${lagginGoals.length} goal${lagginGoals.length !== 1 ? "s" : ""} yet. Don't worry—it's never too late to begin! Pick one and take the first step today.`,
        icon: <Lightbulb className="w-5 h-5 text-blue-500" />,
      });
    }

    // Achievement message
    if (achievements.length > 0) {
      messages.push({
        type: "celebration",
        title: "Achievement Unlocked!",
        message: `You've earned ${achievements.length} achievement${achievements.length !== 1 ? "s" : ""}! Keep up this amazing work, ${studentName}!`,
        icon: <Sparkles className="w-5 h-5 text-pink-500" />,
      });
    }

    // Motivational closing message
    if (messages.length > 0) {
      messages.push({
        type: "motivation",
        title: "You've Got This!",
        message: `Remember, ${studentName}, every goal you complete makes you stronger and smarter. Believe in yourself and keep moving forward! 💪`,
        icon: <Heart className="w-5 h-5 text-red-500" />,
      });
    }

    return messages;
  };

  const messages = generateMessages();

  const typeColors: Record<string, string> = {
    encouragement: "bg-blue-50 border-blue-200",
    tip: "bg-amber-50 border-amber-200",
    celebration: "bg-green-50 border-green-200",
    motivation: "bg-purple-50 border-purple-200",
    insight: "bg-indigo-50 border-indigo-200",
  };

  const typeBadgeColors: Record<string, string> = {
    encouragement: "bg-blue-100 text-blue-800",
    tip: "bg-amber-100 text-amber-800",
    celebration: "bg-green-100 text-green-800",
    motivation: "bg-purple-100 text-purple-800",
    insight: "bg-indigo-100 text-indigo-800",
  };

  return (
    <div className="space-y-4">
      {messages.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">No messages yet</p>
              <p className="text-sm text-gray-500">
                Set some goals to get personalized encouragement!
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        messages.map((msg, index) => (
          <Card
            key={index}
            className={`border-2 transition-all hover:shadow-md ${typeColors[msg.type]}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">{msg.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{msg.title}</h3>
                    <Badge className={typeBadgeColors[msg.type]}>
                      {msg.type.charAt(0).toUpperCase() + msg.type.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{msg.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Motivational Quote */}
      {messages.length > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-lg font-semibold text-indigo-900 mb-2">
                "Success is not final, failure is not fatal."
              </p>
              <p className="text-sm text-indigo-700">
                — Keep learning, keep growing, keep achieving!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
