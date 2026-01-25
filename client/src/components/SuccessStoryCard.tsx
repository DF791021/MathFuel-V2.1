import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface SuccessStoryCardProps {
  story: {
    id: number;
    studentName: string;
    goalName: string;
    goalType: string;
    targetValue: number;
    achievedValue: number;
    title: string;
    description: string;
    testimonial?: string | null;
    tips?: string | null;
    impactScore: number | null;
    isFeature: boolean;
    createdAt: Date;
  };
  reactions?: Array<{ id: number; reactionType: string; studentId: number }>;
  comments?: Array<{ id: number; studentName: string; comment: string; createdAt: Date }>;
  onReact?: (reactionType: string) => void;
  onComment?: () => void;
  onShare?: () => void;
  userReaction?: string;
  isCompact?: boolean;
}

const GOAL_TYPE_COLORS: Record<string, string> = {
  accuracy: "bg-blue-100 text-blue-800",
  score: "bg-green-100 text-green-800",
  games_played: "bg-purple-100 text-purple-800",
  streak: "bg-orange-100 text-orange-800",
  topic_mastery: "bg-pink-100 text-pink-800",
};

const REACTION_EMOJIS: Record<string, string> = {
  like: "👍",
  inspired: "✨",
  helpful: "💡",
  motivating: "🚀",
};

export default function SuccessStoryCard({
  story,
  reactions = [],
  comments = [],
  onReact,
  onComment,
  onShare,
  userReaction,
  isCompact = false,
}: SuccessStoryCardProps) {
  const [showReactions, setShowReactions] = useState(false);

  const reactionCounts = reactions.reduce(
    (acc, r) => {
      acc[r.reactionType] = (acc[r.reactionType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  const progressPercent = story.targetValue > 0 
    ? Math.round((story.achievedValue / story.targetValue) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {story.isFeature && (
                  <Badge className="bg-yellow-500 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <Badge className={GOAL_TYPE_COLORS[story.goalType]}>
                  {story.goalType.replace("_", " ")}
                </Badge>
              </div>
              <CardTitle className="text-lg">{story.title}</CardTitle>
              <CardDescription className="text-sm">
                by {story.studentName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Goal Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{story.goalName}</span>
              <span className="text-muted-foreground">{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              {story.achievedValue} / {story.targetValue}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700">{story.description}</p>

          {/* Testimonial */}
          {story.testimonial && !isCompact && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
              <p className="text-sm italic text-gray-700">
                "{story.testimonial}"
              </p>
            </div>
          )}

          {/* Tips */}
          {story.tips && !isCompact && (
            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded">
              <p className="text-xs font-semibold text-amber-900 mb-1">💡 Tips:</p>
              <p className="text-sm text-gray-700">{story.tips}</p>
            </div>
          )}

          {/* Impact Score */}
          {story.impactScore && story.impactScore > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Impact Score:</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full ${
                      i < Math.round((story.impactScore || 0) / 20)
                        ? "bg-yellow-400"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Engagement Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>{comments.length} comments</span>
            <span>{totalReactions} reactions</span>
          </div>

          {/* Reactions and Actions */}
          {!isCompact && (
            <div className="flex gap-2 pt-2">
              <div className="relative flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowReactions(!showReactions)}
                >
                  <Heart
                    className={`w-4 h-4 mr-2 ${
                      userReaction ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                  React
                </Button>

                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-2 flex gap-1 z-10"
                  >
                    {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                      <button
                        key={type}
                        onClick={() => {
                          onReact?.(type);
                          setShowReactions(false);
                        }}
                        className={`text-2xl p-1 rounded hover:bg-gray-100 transition-colors ${
                          userReaction === type ? "bg-gray-200" : ""
                        }`}
                        title={type}
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onComment}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Comment
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={onShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
