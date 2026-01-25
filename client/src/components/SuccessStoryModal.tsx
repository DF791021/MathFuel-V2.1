import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MessageCircle, Send, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface SuccessStoryModalProps {
  storyId: number;
  isOpen: boolean;
  onClose: () => void;
  onReact?: (storyId: number, reactionType: string) => void;
  onRemoveReaction?: (storyId: number) => void;
}

const REACTION_EMOJIS: Record<string, string> = {
  like: "👍",
  inspired: "✨",
  helpful: "💡",
  motivating: "🚀",
};

const GOAL_TYPE_COLORS: Record<string, string> = {
  accuracy: "bg-blue-100 text-blue-800",
  score: "bg-green-100 text-green-800",
  games_played: "bg-purple-100 text-purple-800",
  streak: "bg-orange-100 text-orange-800",
  topic_mastery: "bg-pink-100 text-pink-800",
};

export default function SuccessStoryModal({
  storyId,
  isOpen,
  onClose,
  onReact,
  onRemoveReaction,
}: SuccessStoryModalProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [showReactions, setShowReactions] = useState(false);

  // Fetch story details
  const { data: story, isLoading: storyLoading } = trpc.successStories.getById.useQuery(
    { id: storyId },
    { enabled: isOpen }
  );

  // Fetch reactions
  const { data: reactions = [], refetch: refetchReactions } = trpc.successStories.getReactions.useQuery(
    { storyId },
    { enabled: isOpen }
  );

  // Fetch comments
  const { data: comments = [], refetch: refetchComments } = trpc.successStories.getComments.useQuery(
    { storyId },
    { enabled: isOpen }
  );

  // Mutations
  const addCommentMutation = trpc.successStories.addComment.useMutation({
    onSuccess: () => {
      setNewComment("");
      refetchComments();
      toast.success("Comment added!");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const deleteCommentMutation = trpc.successStories.deleteComment.useMutation({
    onSuccess: () => {
      refetchComments();
      toast.success("Comment deleted");
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    addCommentMutation.mutate({ storyId, comment: newComment });
  };

  const handleReact = (reactionType: string) => {
    onReact?.(storyId, reactionType);
    setShowReactions(false);
    refetchReactions();
  };

  const reactionCounts = reactions.reduce(
    (acc, r) => {
      acc[r.reactionType] = (acc[r.reactionType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const userReaction = reactions.find((r) => r.studentId === user?.id)?.reactionType;
  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  if (!story && !storyLoading) return null;

  const progressPercent = story && story.targetValue > 0
    ? Math.round((story.achievedValue / story.targetValue) * 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {storyLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        ) : story ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
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
              <DialogTitle className="text-2xl">{story.title}</DialogTitle>
              <DialogDescription>
                Success story by {story.studentName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Goal Progress */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{story.goalName}</CardTitle>
                  <CardDescription>Achievement Progress</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Progress</span>
                    <span className="text-muted-foreground">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Achieved: {story.achievedValue} / Target: {story.targetValue}
                  </div>
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
                </CardContent>
              </Card>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">Story</h3>
                <p className="text-gray-700">{story.description}</p>
              </div>

              {/* Testimonial */}
              {story.testimonial && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Student Testimonial</p>
                  <p className="text-gray-700 italic">"{story.testimonial}"</p>
                </div>
              )}

              {/* Tips */}
              {story.tips && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                  <p className="text-sm font-semibold text-amber-900 mb-2">💡 Tips for Success</p>
                  <p className="text-gray-700">{story.tips}</p>
                </div>
              )}

              {/* Engagement Section */}
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Engagement</h3>
                  <div className="text-sm text-muted-foreground">
                    {totalReactions} reactions • {comments.length} comments
                  </div>
                </div>

                {/* Reactions */}
                <div className="space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(reactionCounts).map(([type, count]) => (
                      <Badge key={type} variant="secondary" className="text-base py-1 px-2">
                        {REACTION_EMOJIS[type]} {count}
                      </Badge>
                    ))}
                  </div>

                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReactions(!showReactions)}
                      className="w-full"
                    >
                      <Heart
                        className={`w-4 h-4 mr-2 ${
                          userReaction ? "fill-red-500 text-red-500" : ""
                        }`}
                      />
                      {userReaction ? "Change Reaction" : "Add Reaction"}
                    </Button>

                    <AnimatePresence>
                      {showReactions && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-3 flex gap-2 z-10"
                        >
                          {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                            <button
                              key={type}
                              onClick={() => handleReact(type)}
                              className={`text-3xl p-2 rounded hover:bg-gray-100 transition-colors ${
                                userReaction === type ? "bg-gray-200" : ""
                              }`}
                              title={type}
                            >
                              {emoji}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Comments ({comments.length})
                  </h4>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    <AnimatePresence>
                      {comments.map((comment: any) => (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-gray-50 p-3 rounded border"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-semibold text-sm">{comment.studentName}</p>
                            {comment.studentId === user?.id && (
                              <button
                                onClick={() => deleteCommentMutation.mutate({ commentId: comment.id })}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{comment.comment}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Add Comment */}
                  <div className="space-y-2 border-t pt-3">
                    <Textarea
                      placeholder="Share your encouragement..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addCommentMutation.isPending}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
