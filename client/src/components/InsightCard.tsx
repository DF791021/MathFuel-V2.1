import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  AlertCircle,
  Lightbulb,
  Heart,
  Brain,
} from "lucide-react";

interface InsightCardProps {
  type: "progress_trend" | "challenge_pattern" | "strategy_effectiveness" | "motivation_level" | "learning_style";
  insight: string;
  supportingData: string;
}

const insightConfig = {
  progress_trend: {
    icon: TrendingUp,
    title: "Progress Trend",
    color: "bg-blue-50",
    badgeColor: "bg-blue-100 text-blue-800",
    description: "Your overall learning trajectory",
  },
  challenge_pattern: {
    icon: AlertCircle,
    title: "Challenge Patterns",
    color: "bg-orange-50",
    badgeColor: "bg-orange-100 text-orange-800",
    description: "Common obstacles you face",
  },
  strategy_effectiveness: {
    icon: Lightbulb,
    title: "Effective Strategies",
    color: "bg-green-50",
    badgeColor: "bg-green-100 text-green-800",
    description: "What's working well for you",
  },
  motivation_level: {
    icon: Heart,
    title: "Motivation & Engagement",
    color: "bg-pink-50",
    badgeColor: "bg-pink-100 text-pink-800",
    description: "Your emotional and engagement state",
  },
  learning_style: {
    icon: Brain,
    title: "Learning Style",
    color: "bg-purple-50",
    badgeColor: "bg-purple-100 text-purple-800",
    description: "Your preferred learning approaches",
  },
};

export default function InsightCard({
  type,
  insight,
  supportingData,
}: InsightCardProps) {
  const config = insightConfig[type];
  const Icon = config.icon;

  return (
    <Card className={`${config.color} border-0`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg">
              <Icon className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{config.description}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Insight */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Key Insight</p>
          <p className="text-gray-800 leading-relaxed">{insight}</p>
        </div>

        {/* Supporting Data */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Supporting Evidence</p>
          <div className="bg-white bg-opacity-50 rounded-lg p-3 border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">{supportingData}</p>
          </div>
        </div>

        {/* Badge */}
        <div className="pt-2">
          <Badge className={config.badgeColor}>
            {config.title}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
