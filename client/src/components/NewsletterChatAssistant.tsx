import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, X, Minimize2, Maximize2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type ChatState = "greeting" | "age_collection" | "email_collection" | "confirmation";

export function NewsletterChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [chatState, setChatState] = useState<ChatState>("greeting");
  const [userAge, setUserAge] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const subscribeMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: () => {
      toast.success("Welcome to Signal Weekly!");
      setChatState("confirmation");
      addAssistantMessage(
        "🎉 Perfect! You're all set. Check your email for our latest insights. Welcome to the Signal Weekly community!"
      );
    },
    onError: (error) => {
      if (error.message.includes("already subscribed")) {
        addAssistantMessage(
          "It looks like this email is already subscribed. Thanks for your interest in Signal Weekly!"
        );
      } else {
        addAssistantMessage(
          "Oops! Something went wrong. Please try again later."
        );
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addAssistantMessage(
        "👋 Hi there! I'm Signal Weekly's AI assistant. I'd love to help you stay updated with the latest AI insights. What's your name?"
      );
    }
  }, [isOpen]);

  const addAssistantMessage = (content: string) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      type: "assistant",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const addUserMessage = (content: string) => {
    const message: Message = {
      id: `msg-${Date.now()}-user`,
      type: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    addUserMessage(inputValue);
    const userInput = inputValue.toLowerCase().trim();
    setInputValue("");

    // State machine for chat flow
    if (chatState === "greeting") {
      // After greeting, ask for age
      setChatState("age_collection");
      addAssistantMessage(
        "Nice to meet you! 🎯 To personalize your newsletter experience, how old are you? (Please enter a number between 13 and 150)"
      );
    } else if (chatState === "age_collection") {
      // Validate age input
      const age = parseInt(userInput);
      if (isNaN(age) || age < 13 || age > 150) {
        addAssistantMessage(
          "Please enter a valid age between 13 and 150. 📅"
        );
        return;
      }
      setUserAge(age);
      setChatState("email_collection");
      addAssistantMessage(
        `Great! ${age} is perfect. 📧 Now, what's your email address? I'll use it to send you weekly AI insights.`
      );
    } else if (chatState === "email_collection") {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userInput)) {
        addAssistantMessage(
          "That doesn't look like a valid email. Please try again. 📬"
        );
        return;
      }
      setUserEmail(userInput);
      setChatState("confirmation");

      // Subscribe the user
      if (userAge !== null) {
        subscribeMutation.mutate({
          email: userInput,
          age: userAge,
          source: "chat",
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-accent to-primary text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="Open chat assistant"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 h-[600px] flex flex-col shadow-2xl border-2 border-accent/20 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-accent to-primary text-accent-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">Signal Weekly AI</h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.type === "user"
                          ? "bg-accent text-accent-foreground rounded-br-none"
                          : "bg-muted text-foreground rounded-bl-none"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {subscribeMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground px-4 py-2 rounded-lg rounded-bl-none">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-foreground rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              {chatState !== "confirmation" && (
                <div className="border-t border-border p-4 bg-card">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        chatState === "age_collection"
                          ? "Enter your age..."
                          : chatState === "email_collection"
                            ? "Enter your email..."
                            : "Type your response..."
                      }
                      className="flex-1 rounded-lg"
                      disabled={subscribeMutation.isPending}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        !inputValue.trim() || subscribeMutation.isPending
                      }
                      size="icon"
                      className="rounded-lg bg-accent hover:bg-accent/90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Confirmation State */}
              {chatState === "confirmation" && (
                <div className="border-t border-border p-4 bg-card">
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      setIsMinimized(false);
                      // Reset chat for next user
                      setMessages([]);
                      setChatState("greeting");
                      setUserAge(null);
                      setUserEmail(null);
                    }}
                    className="w-full bg-accent hover:bg-accent/90 rounded-lg"
                  >
                    Close
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      )}
    </>
  );
}
