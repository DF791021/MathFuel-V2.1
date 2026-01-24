import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader, Save, X } from "lucide-react";

interface JournalEntryEditorProps {
  playerId: number;
  playerName: string;
  goalId?: number;
  onSaved?: () => void;
  onCancel?: () => void;
}

export default function JournalEntryEditor({
  playerId,
  playerName,
  goalId,
  onSaved,
  onCancel,
}: JournalEntryEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("neutral");
  const [challengesFaced, setChallengesFaced] = useState("");
  const [strategiesUsed, setStrategiesUsed] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  const createEntryMutation = trpc.journal.createEntry.useMutation({
    onSuccess: () => {
      toast.success("Journal entry saved successfully!");
      setTitle("");
      setContent("");
      setMood("neutral");
      setChallengesFaced("");
      setStrategiesUsed("");
      setLessonsLearned("");
      setNextSteps("");
      setIsPrivate(false);
      onSaved?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save journal entry");
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!content.trim()) {
      toast.error("Please write your reflection");
      return;
    }

    createEntryMutation.mutate({
      playerId,
      playerName,
      goalId,
      title: title.trim(),
      content: content.trim(),
      mood: mood as any,
      challengesFaced: challengesFaced.trim() || null,
      strategiesUsed: strategiesUsed.trim() || null,
      lessonsLearned: lessonsLearned.trim() || null,
      nextSteps: nextSteps.trim() || null,
      isPrivate,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Reflection</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Take time to reflect on your progress, challenges, and learning strategies.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title */}
        <div>
          <Label htmlFor="title" className="text-sm font-medium">
            Reflection Title
          </Label>
          <Input
            id="title"
            placeholder="e.g., Progress on Accuracy Goal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Main Content */}
        <div>
          <Label htmlFor="content" className="text-sm font-medium">
            Your Reflection
          </Label>
          <Textarea
            id="content"
            placeholder="Write your thoughts about your progress, what you've learned, and how you're feeling..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="mt-2"
          />
          <p className="text-xs text-gray-500 mt-1">
            {content.length} characters
          </p>
        </div>

        {/* Mood */}
        <div>
          <Label htmlFor="mood" className="text-sm font-medium">
            How are you feeling?
          </Label>
          <Select value={mood} onValueChange={setMood}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">
                <span className="flex items-center gap-2">
                  😄 Excellent
                </span>
              </SelectItem>
              <SelectItem value="good">
                <span className="flex items-center gap-2">
                  😊 Good
                </span>
              </SelectItem>
              <SelectItem value="neutral">
                <span className="flex items-center gap-2">
                  😐 Neutral
                </span>
              </SelectItem>
              <SelectItem value="struggling">
                <span className="flex items-center gap-2">
                  😕 Struggling
                </span>
              </SelectItem>
              <SelectItem value="discouraged">
                <span className="flex items-center gap-2">
                  😞 Discouraged
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Challenges */}
        <div>
          <Label htmlFor="challenges" className="text-sm font-medium">
            Challenges I Faced
          </Label>
          <Textarea
            id="challenges"
            placeholder="What obstacles did you encounter? What made things difficult?"
            value={challengesFaced}
            onChange={(e) => setChallengesFaced(e.target.value)}
            rows={3}
            className="mt-2"
          />
        </div>

        {/* Strategies */}
        <div>
          <Label htmlFor="strategies" className="text-sm font-medium">
            Strategies I Used
          </Label>
          <Textarea
            id="strategies"
            placeholder="What approaches or techniques did you try? What worked well?"
            value={strategiesUsed}
            onChange={(e) => setStrategiesUsed(e.target.value)}
            rows={3}
            className="mt-2"
          />
        </div>

        {/* Lessons */}
        <div>
          <Label htmlFor="lessons" className="text-sm font-medium">
            Lessons Learned
          </Label>
          <Textarea
            id="lessons"
            placeholder="What did you learn from this experience? What insights did you gain?"
            value={lessonsLearned}
            onChange={(e) => setLessonsLearned(e.target.value)}
            rows={3}
            className="mt-2"
          />
        </div>

        {/* Next Steps */}
        <div>
          <Label htmlFor="next-steps" className="text-sm font-medium">
            Next Steps
          </Label>
          <Textarea
            id="next-steps"
            placeholder="What will you do differently next time? What's your plan moving forward?"
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
            rows={3}
            className="mt-2"
          />
        </div>

        {/* Privacy */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="private"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="private" className="text-sm font-medium cursor-pointer">
            Keep this reflection private (only visible to you)
          </Label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={createEntryMutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {createEntryMutation.isPending ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Reflection
              </>
            )}
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
