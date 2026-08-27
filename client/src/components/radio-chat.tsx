import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { MessageCircle, Send, User, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useChat } from "@/lib/chat-context";

const chatColors = [
  {
    text: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
  },
  { text: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  { text: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
  {
    text: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
  },
  {
    text: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    text: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
  },
  { text: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { text: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
  {
    text: "text-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  { text: "text-teal-500", bg: "bg-teal-500/10", border: "border-teal-500/20" },
];

function getUserColor(username: string): {
  text: string;
  bg: string;
  border: string;
} {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const index = Math.abs(hash) % chatColors.length;
  return (
    chatColors[index] ?? {
      text: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    }
  );
}

type RadioChatProps = {
  className?: string;
  showHeader?: boolean;
  variant?: "card" | "flat";
};

export function RadioChat({
  className,
  showHeader = true,
  variant = "card",
}: RadioChatProps) {
  const shouldReduceMotion = useReducedMotion();
  const { messages, username, setUsername, sendMessage } = useChat();
  const [inputMessage, setInputMessage] = useState("");
  const [usernameDraft, setUsernameDraft] = useState(username);
  const [isUsernameOpen, setIsUsernameOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  const checkIfAtBottom = () => {
    const scrollViewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (scrollViewport) {
      const { scrollTop, scrollHeight, clientHeight } = scrollViewport;
      const threshold = 70;
      isAtBottomRef.current =
        scrollHeight - scrollTop - clientHeight < threshold;
    }
  };

  const scrollToBottom = (smooth: boolean = true) => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "nearest",
        });
      }
    }, 50);
  };

  useEffect(() => {
    const scrollViewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]",
    );
    if (scrollViewport) {
      const handleScroll = () => checkIfAtBottom();
      scrollViewport.addEventListener("scroll", handleScroll);
      return () => scrollViewport.removeEventListener("scroll", handleScroll);
    }
  }, []);

  useEffect(() => {
    if (isUsernameOpen) {
      setUsernameDraft(username);
    }
  }, [isUsernameOpen, username]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(true);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    await sendMessage(inputMessage);
    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const cardClassName = useMemo(() => {
    if (variant === "flat") {
      return cn(
        "h-full min-h-0 flex flex-col overflow-hidden border-0 bg-transparent shadow-none hover:shadow-none",
        className,
      );
    }
    return cn("h-full min-h-0 flex flex-col overflow-hidden border-border", className);
  }, [className, variant]);

  return (
    <Card className={cardClassName}>
      {showHeader && (
        <CardHeader className="pb-3 flex-shrink-0 border-b border-border bg-card">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MessageCircle className="h-5 w-5 text-primary" />
              Live Chat
            </CardTitle>

            <Popover open={isUsernameOpen} onOpenChange={setIsUsernameOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 px-3 rounded-xl"
                  aria-label="Edit chat username"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="max-w-[120px] truncate text-sm">{username}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={8} className="w-72 p-3">
                <div className="space-y-2">
                  <p className="text-md sm:text-sm font-medium tracking-wider text-muted-foreground">
                    Edit your username
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={usernameDraft}
                      onChange={(e) => setUsernameDraft(e.target.value)}
                      className="h-10"
                      aria-label="Chat username"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          setUsername(usernameDraft);
                          setIsUsernameOpen(false);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      className="h-10"
                      onClick={() => {
                        setUsername(usernameDraft);
                        setIsUsernameOpen(false);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden">
        <ScrollArea className="flex-1 min-h-0 px-4 py-4" ref={scrollAreaRef}>
          <div className="space-y-3 pb-4">
            <AnimatePresence>
              {messages.map((msg) => {
                const userColor = getUserColor(msg.username || "User");
                return (
                  <motion.div
                    key={msg.id}
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      msg.isSystem && "justify-center",
                    )}
                  >
                    {!msg.isSystem && (
                      <Avatar
                        className={cn(
                          "h-8 w-8 flex-shrink-0",
                          userColor.border,
                          "border",
                        )}
                      >
                        <AvatarFallback
                          className={cn(
                            userColor.bg,
                            userColor.text,
                            "font-medium",
                          )}
                        >
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "flex-1 min-w-0",
                        msg.isSystem && "text-center",
                      )}
                    >
                      {!msg.isSystem && (
                        <p
                          className={cn(
                            "text-xs font-semibold mb-1",
                            userColor.text,
                          )}
                        >
                          {msg.username}
                        </p>
                      )}
                      <p
                        className={cn(
                          "text-sm rounded-lg px-3 py-2 break-words",
                          msg.isSystem
                            ? "bg-muted text-muted-foreground italic inline-block"
                            : "bg-muted/50 text-foreground",
                        )}
                      >
                        {msg.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 p-4 bg-card border-t border-border">
          <Input
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-11 bg-background border-input text-foreground placeholder:text-muted-foreground"
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="h-11 w-11 bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
