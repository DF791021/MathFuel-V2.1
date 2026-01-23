import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, X, Sparkles, History, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: string;
  timestamp: Date;
}

export type ChatMode = "general" | "ideas" | "resources" | "trivia" | "challenges";

interface TeacherChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function TeacherChatbot({ isOpen = true, onClose }: TeacherChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedMode, setSelectedMode] = useState<ChatMode>("general");
  const [isLoading, setIsLoading] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(messages.length === 0);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [showConversationList, setShowConversationList] = useState(false);
  const [conversationTitle, setConversationTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries and mutations
  const { data: modes = [] } = trpc.teacherChatbot.getModes.useQuery();
  const conversationsQuery = trpc.chatHistory.getConversations.useQuery();
  const messagesQuery = trpc.chatHistory.getMessages.useQuery(
    { conversationId: currentConversationId! },
    { enabled: !!currentConversationId }
  );
  
  const createConversationMutation = trpc.chatHistory.createConversation.useMutation({
    onSuccess: (data) => {
      setCurrentConversationId(data.id);
      setMessages([]);
      setShowModeSelector(true);
      conversationsQuery.refetch();
      toast.success("New conversation created");
    },
    onError: (error) => {
      toast.error(`Failed to create conversation: ${error.message}`);
    },
  });

  const addMessageMutation = trpc.chatHistory.addMessage.useMutation({
    onSuccess: () => {
      if (currentConversationId) {
        messagesQuery.refetch();
      }
    },
  });

  const deleteConversationMutation = trpc.chatHistory.deleteConversation.useMutation({
    onSuccess: () => {
      setCurrentConversationId(null);
      setMessages([]);
      conversationsQuery.refetch();
      toast.success("Conversation deleted");
    },
    onError: (error) => {
      toast.error(`Failed to delete conversation: ${error.message}`);
    },
  });

  const sendMessageMutation = trpc.teacherChatbot.sendMessage.useMutation({
    onSuccess: async (data) => {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: data.message,
        mode: data.mode,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Save assistant message to history if conversation exists
      if (currentConversationId) {
        await addMessageMutation.mutateAsync({
          conversationId: currentConversationId,
          role: "assistant",
          content: data.message,
          mode: selectedMode,
        });
      }
      
      setIsLoading(false);
      setShowModeSelector(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setIsLoading(false);
    },
  });

  // Load messages when conversation changes
  useEffect(() => {
    if (messagesQuery.data) {
      setMessages(
        messagesQuery.data.map((msg) => ({
          id: `msg-${msg.id}`,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          mode: msg.mode,
          timestamp: new Date(msg.createdAt),
        }))
      );
    }
  }, [messagesQuery.data]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Create new conversation if needed
    if (!currentConversationId) {
      const title = conversationTitle || `${selectedMode} Chat - ${new Date().toLocaleString()}`;
      createConversationMutation.mutate({ title, mode: selectedMode });
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      mode: selectedMode,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Save user message to history
    await addMessageMutation.mutateAsync({
      conversationId: currentConversationId,
      role: "user",
      content: input,
      mode: selectedMode,
    });

    // Send to chatbot
    sendMessageMutation.mutate({
      message: input,
      mode: selectedMode,
    });
  };

  const handleLoadConversation = (conversationId: number) => {
    setCurrentConversationId(conversationId);
    setShowConversationList(false);
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowModeSelector(true);
    setConversationTitle("");
  };

  const handleDeleteConversation = (conversationId: number) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteConversationMutation.mutate({ conversationId });
    }
  };

  const modeConfig: Record<ChatMode, { icon: string; label: string; description: string }> = {
    general: { icon: "💬", label: "General Support", description: "Get advice and support for teaching challenges" },
    ideas: { icon: "💡", label: "Lesson Ideas", description: "Get creative lesson ideas and classroom strategies" },
    resources: { icon: "📚", label: "Resources", description: "Find teaching resources and materials" },
    trivia: { icon: "🌍", label: "Fun Trivia", description: "Learn interesting facts and trivia" },
    challenges: { icon: "🎯", label: "Challenges", description: "Get fun challenges and activities for students" },
  };

  const currentModeConfig = modeConfig[selectedMode];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Teacher Assistant AI
            </DialogTitle>
            <DialogDescription>
              {currentModeConfig.icon} {currentModeConfig.label} • {currentModeConfig.description}
            </DialogDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConversationList(!showConversationList)}
              className="gap-2"
            >
              <History className="w-4 h-4" />
              History
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewConversation}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4">
          {/* Conversation List */}
          {showConversationList && (
            <Card className="w-64 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Saved Conversations</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto space-y-2">
                {conversationsQuery.data?.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-2 rounded cursor-pointer hover:bg-accent transition-colors ${
                      currentConversationId === conv.id ? "bg-accent" : ""
                    }`}
                  >
                    <div
                      onClick={() => handleLoadConversation(conv.id)}
                      className="flex-1"
                    >
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">{conv.messageCount} messages</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-muted/50 rounded-lg">
              {messages.length === 0 && showModeSelector && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <MessageCircle className="w-12 h-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">
                    {currentConversationId ? "Start a new conversation" : "Select a mode to begin"}
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Streamdown>{msg.content}</Streamdown>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Mode Selector */}
            {showModeSelector && messages.length === 0 && (
              <div className="p-4 border-t space-y-3">
                <p className="text-sm font-medium">Select a mode:</p>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(modeConfig) as [ChatMode, typeof modeConfig.general][]).map(
                    ([mode, config]) => (
                      <Button
                        key={mode}
                        variant={selectedMode === mode ? "default" : "outline"}
                        onClick={() => setSelectedMode(mode)}
                        className="justify-start gap-2"
                      >
                        <span>{config.icon}</span>
                        <span className="text-xs">{config.label}</span>
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t space-y-2">
              {!currentConversationId && (
                <Input
                  placeholder="Conversation title (optional)"
                  value={conversationTitle}
                  onChange={(e) => setConversationTitle(e.target.value)}
                  className="text-sm"
                />
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isLoading}
                  className="text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !input.trim()}
                  size="sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
