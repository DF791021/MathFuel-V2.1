import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import SuccessStoryCard from "./SuccessStoryCard";
import SuccessStoryModal from "./SuccessStoryModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface SuccessStoriesGalleryProps {
  classId?: number;
  showFeaturedOnly?: boolean;
}

export default function SuccessStoriesGallery({
  classId,
  showFeaturedOnly = false,
}: SuccessStoriesGalleryProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGoalType, setSelectedGoalType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "engagement" | "impact">("newest");
  const [selectedStory, setSelectedStory] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch stories
  const { data: stories = [], isLoading, refetch } = trpc.successStories.getStories.useQuery({
    classId,
    isFeature: showFeaturedOnly ? true : undefined,
    isPublished: showFeaturedOnly ? true : undefined,
    limit: 100,
  });

  // Fetch featured stories
  const { data: featuredStories = [] } = trpc.successStories.getFeaturedStories.useQuery(
    { classId: classId || 0 },
    { enabled: !!classId }
  );

  // Fetch stories with stats
  const { data: storiesWithStats = [] } = trpc.successStories.getStoriesWithStats.useQuery({
    classId,
  });

  // Mutations
  const addReactionMutation = trpc.successStories.addReaction.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Reaction added!");
    },
    onError: () => {
      toast.error("Failed to add reaction");
    },
  });

  const removeReactionMutation = trpc.successStories.removeReaction.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Reaction removed");
    },
    onError: () => {
      toast.error("Failed to remove reaction");
    },
  });

  // Filter and sort stories
  const filteredStories = useMemo(() => {
    let filtered = stories;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.description.toLowerCase().includes(term) ||
          s.studentName.toLowerCase().includes(term) ||
          s.goalName.toLowerCase().includes(term)
      );
    }

    // Goal type filter
    if (selectedGoalType) {
      filtered = filtered.filter((s) => s.goalType === selectedGoalType);
    }

    // Sort
    if (sortBy === "newest") {
      filtered = [...filtered].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sortBy === "engagement") {
      const statsMap = new Map(storiesWithStats.map((s) => [s.id, s.totalEngagement || 0]));
      filtered = [...filtered].sort(
        (a, b) => (statsMap.get(b.id) || 0) - (statsMap.get(a.id) || 0)
      );
    } else if (sortBy === "impact") {
      filtered = [...filtered].sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
    }

    return filtered;
  }, [stories, searchTerm, selectedGoalType, sortBy, storiesWithStats]);

  const featuredCount = filteredStories.filter((s) => s.isFeature).length;

  const handleReact = (storyId: number, reactionType: string) => {
    addReactionMutation.mutate({ storyId, reactionType: reactionType as "like" | "inspired" | "helpful" | "motivating" });
  };

  const handleRemoveReaction = (storyId: number) => {
    removeReactionMutation.mutate({ storyId });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
              <div className="h-8 bg-gray-200 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Success Stories</h2>
          <p className="text-muted-foreground">
            Celebrate student achievements and share inspiring journeys
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Select value={selectedGoalType || "all"} onValueChange={(v) => setSelectedGoalType(v === "all" ? null : v)}>
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Goal Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="accuracy">Accuracy</SelectItem>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="games_played">Games Played</SelectItem>
                <SelectItem value="streak">Streak</SelectItem>
                <SelectItem value="topic_mastery">Topic Mastery</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="engagement">Most Engaged</SelectItem>
                <SelectItem value="impact">Highest Impact</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Stories ({filteredStories.length})</TabsTrigger>
          <TabsTrigger value="featured">
            <Sparkles className="w-4 h-4 mr-2" />
            Featured ({featuredCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredStories.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground mb-4">No success stories yet</p>
                <p className="text-sm text-muted-foreground">
                  Completed goals will appear here as success stories
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStories.map((story) => {
                const storyStats = storiesWithStats.find((s) => s.id === story.id);
                return (
                  <div
                    key={story.id}
                    onClick={() => setSelectedStory(story.id)}
                    className="cursor-pointer"
                  >
                    <SuccessStoryCard
                      story={story}
                      reactions={[]}
                      comments={[]}
                      onReact={(type) => handleReact(story.id, type)}
                      onComment={() => setSelectedStory(story.id)}
                      isCompact
                    />
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          {featuredStories.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No featured stories yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredStories.map((story) => {
                return (
                  <div
                    key={story.id}
                    onClick={() => setSelectedStory(story.id)}
                    className="cursor-pointer"
                  >
                    <SuccessStoryCard
                      story={story}
                      reactions={[]}
                      comments={[]}
                      onReact={(type) => handleReact(story.id, type)}
                      onComment={() => setSelectedStory(story.id)}
                      isCompact
                    />
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal for detailed view */}
      {selectedStory && (
        <SuccessStoryModal
          storyId={selectedStory}
          isOpen={!!selectedStory}
          onClose={() => setSelectedStory(null)}
          onReact={handleReact}
          onRemoveReaction={handleRemoveReaction}
        />
      )}
    </div>
  );
}
