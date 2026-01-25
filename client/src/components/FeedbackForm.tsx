import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface FeedbackFormProps {
  trialAccountId?: number;
  onSuccess?: () => void;
}

export function FeedbackForm({ trialAccountId, onSuccess }: FeedbackFormProps) {
  const [feedbackType, setFeedbackType] = useState<string>("bug");
  const [category, setCategory] = useState<string>("game");
  const [rating, setRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = trpc.feedback.submitFeedback.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setTitle("");
      setDescription("");
      setRating(null);
      setFeedbackType("bug");
      setCategory("game");
      setTimeout(() => {
        setSubmitted(false);
        onSuccess?.();
      }, 3000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please fill in all required fields");
      return;
    }
    submitFeedback.mutate({
      feedbackType: feedbackType as "bug" | "feature_request" | "usability" | "performance" | "other",
      category: category as "game" | "certificates" | "analytics" | "ui" | "mobile" | "other",
      rating: rating || undefined,
      title: title.trim(),
      description: description.trim(),
      trialAccountId,
    });
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Thank you for your feedback!</p>
              <p className="text-sm text-green-700">We appreciate your input and will review it shortly.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Your Feedback</CardTitle>
        <CardDescription>Help us improve Wisconsin Nutrition Explorer by sharing your thoughts and suggestions</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">What type of feedback?</Label>
            <RadioGroup value={feedbackType} onValueChange={setFeedbackType}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bug" id="bug" />
                <Label htmlFor="bug" className="font-normal cursor-pointer">🐛 Bug Report - Something isn't working</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feature_request" id="feature_request" />
                <Label htmlFor="feature_request" className="font-normal cursor-pointer">✨ Feature Request - I'd like to see...</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="usability" id="usability" />
                <Label htmlFor="usability" className="font-normal cursor-pointer">🎯 Usability Issue - Something is confusing</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="performance" id="performance" />
                <Label htmlFor="performance" className="font-normal cursor-pointer">⚡ Performance - App is slow or laggy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">💬 Other - General comment</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className="font-semibold">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="game">Game & Gameplay</SelectItem>
                <SelectItem value="certificates">Certificates & Recognition</SelectItem>
                <SelectItem value="analytics">Analytics & Reporting</SelectItem>
                <SelectItem value="ui">User Interface & Design</SelectItem>
                <SelectItem value="mobile">Mobile Experience</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div className="space-y-3">
            <Label className="font-semibold">How satisfied are you with this feature? (Optional)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(rating === star ? null : star)}
                  className={`text-2xl transition-transform hover:scale-110 ${
                    rating && rating >= star ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="font-semibold">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Brief summary of your feedback"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
            <p className="text-xs text-gray-500">{title.length}/100 characters</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="font-semibold">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide details about your feedback. Include steps to reproduce if reporting a bug."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={1000}
              required
            />
            <p className="text-xs text-gray-500">{description.length}/1000 characters</p>
          </div>

          {/* Info Box */}
          <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Your feedback is valuable and will be reviewed by our team. We may follow up for clarification.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={submitFeedback.isPending || !title.trim() || !description.trim()}
            className="w-full"
            size="lg"
          >
            {submitFeedback.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Feedback"
            )}
          </Button>

          {submitFeedback.isError && (
            <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">
                Failed to submit feedback. Please try again or contact support.
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
