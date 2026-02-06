import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, MessageSquare, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

const messageSchema = z.object({
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  messageType: z.enum(["general", "progress_update", "concern", "celebration", "question"]),
});

export default function ParentTeacherMessaging() {
  const [, params] = useRoute("/parent/messages/:studentId");
  const studentId = params?.studentId ? parseInt(params.studentId) : null;
  const [, setLocation] = useRoute();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"general" | "progress_update" | "concern" | "celebration" | "question">("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: messages, isLoading, refetch } = trpc.parentPortal.getMessages.useQuery(
    { studentId: studentId || 0 },
    { enabled: !!studentId }
  );

  const sendMessageMutation = trpc.parentPortal.sendMessage.useMutation({
    onSuccess: () => {
      toast.success("Message sent successfully!");
      setSubject("");
      setMessage("");
      setMessageType("general");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      messageSchema.parse({ subject, message, messageType });

      if (!studentId) {
        toast.error("Invalid student ID");
        return;
      }

      await sendMessageMutation.mutateAsync({
        recipientId: 1, // Would be teacher ID in real implementation
        studentId,
        subject,
        message,
        messageType,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to send message");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => setLocation("/parent")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-96 mb-6" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  const messageTypeColors: Record<string, string> = {
    general: "bg-blue-100 text-blue-800",
    progress_update: "bg-green-100 text-green-800",
    concern: "bg-red-100 text-red-800",
    celebration: "bg-yellow-100 text-yellow-800",
    question: "bg-purple-100 text-purple-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button variant="outline" onClick={() => setLocation("/parent")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Parent-Teacher Messaging</h1>
          <p className="text-gray-600">Communicate with your student's teacher about progress and concerns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Compose */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Send a Message</CardTitle>
                <CardDescription>Reach out to the teacher</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Message Type</label>
                    <select
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="progress_update">Progress Update</option>
                      <option value="concern">Concern</option>
                      <option value="celebration">Celebration</option>
                      <option value="question">Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Subject</label>
                    <Input
                      placeholder="Message subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Message</label>
                    <Textarea
                      placeholder="Write your message here..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      className="text-sm"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting || sendMessageMutation.isPending}>
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Message History */}
          <div className="lg:col-span-2">
            {messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((msg: any) => (
                  <Card key={msg.id} className={msg.isRead ? "" : "border-blue-300 bg-blue-50"}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-base">{msg.subject}</CardTitle>
                            <Badge className={messageTypeColors[msg.messageType] || "bg-gray-100 text-gray-800"}>
                              {msg.messageType.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <CardDescription>
                            {msg.senderName} • {new Date(msg.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        {!msg.isRead && (
                          <Badge variant="default" className="flex-shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                      {msg.reply && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-sm font-medium text-gray-600 mb-2">Teacher's Reply:</p>
                          <div className="bg-gray-50 p-3 rounded border border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap text-sm">{msg.reply}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-gray-200 bg-gray-50">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <MessageSquare className="w-6 h-6 text-gray-400 flex-shrink-0 mt-1" />
                    <div>
                      <CardTitle className="text-gray-900">No Messages Yet</CardTitle>
                      <CardDescription className="text-gray-600 mt-2">
                        Start a conversation with your student's teacher using the form on the left.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
