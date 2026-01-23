import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, MessageCircle, X, Sparkles } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries and mutations
  const { data: modes = [] } = trpc.teacherChatbot.getModes.useQuery();
  const sendMessageMutation = trpc.teacherChatbot.sendMessage.useMutation({
    onSuccess: (data) => {
      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: data.message,
        mode: data.mode,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
      setShowModeSelector(false);
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
      setIsLoading(false);
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Convert messages to the format expected by the API
    const conversationHistory = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    await sendMessageMutation.mutateAsync({
      message: input,
      mode: selectedMode,
      conversationHistory,
    });
  };

  const handleModeChange = (mode: ChatMode) => {
    setSelectedMode(mode);
    setShowModeSelector(false);
    
    // Add a system message about the mode change
    const modeInfo = modes.find((m) => m.id === mode);
    if (modeInfo) {
      const systemMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: `I'm now in ${modeInfo.name} mode. ${modeInfo.description}. How can I help you?`,
        mode: mode,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMessage]);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setShowModeSelector(true);
  };

  if (!isOpen) return null;

  const currentModeInfo = modes.find((m) => m.id === selectedMode);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="border-b p-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <div>
                <DialogTitle>Teacher Assistant AI</DialogTitle>
                <DialogDescription>
                  {currentModeInfo?.name} • {currentModeInfo?.description}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClose?.()}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !showModeSelector && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <MessageCircle className="w-12 h-12 mx-auto text-gray-400" />
                <p className="text-gray-600">Start a conversation!</p>
              </div>
            </div>
          )}

          {/* Mode Selector */}
          {showModeSelector && messages.length === 0 && (
            <div className="space-y-3">
              <p className="font-semibold text-sm text-gray-700">Choose a mode:</p>
              <div className="grid grid-cols-2 gap-2">
                {modes.map((mode) => (
                  <Button
                    key={mode.id}
                    variant="outline"
                    className="justify-start h-auto p-3 text-left"
                    onClick={() => handleModeChange(mode.id as ChatMode)}
                  >
                    <div>
                      <div className="font-medium text-sm">{mode.icon} {mode.name}</div>
                      <div className="text-xs text-gray-600">{mode.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === "user"
                    ? "bg-purple-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-900 rounded-bl-none"
                }`}
              >
                {message.role === "assistant" ? (
                  <Streamdown>{message.content}</Streamdown>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg rounded-bl-none">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4 space-y-2">
          {messages.length > 0 && (
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>{messages.length} messages</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="h-6 text-xs"
              >
                Clear Chat
              </Button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Ask me anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="sm"
              className="gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>

          {/* Mode Switcher */}
          {messages.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {modes.map((mode) => (
                <Badge
                  key={mode.id}
                  variant={selectedMode === mode.id ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleModeChange(mode.id as ChatMode)}
                >
                  {mode.icon} {mode.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
