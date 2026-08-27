import { useEffect, useState } from "react";
import { MessageCircle, Pencil, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { RadioChat } from "@/components/radio-chat";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useChat } from "@/lib/chat-context";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export function ChatFullMode() {
  const isMobile = useIsMobile();
  const { isFullChatOpen, setFullChatOpen, username, setUsername } = useChat();
  const [isUsernameOpen, setIsUsernameOpen] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState(username);

  useEffect(() => {
    if (!isUsernameOpen) return;
    setUsernameDraft(username);
  }, [isUsernameOpen, username]);

  if (isMobile) {
    return (
      <Drawer open={isFullChatOpen} onOpenChange={setFullChatOpen}>
        <DrawerContent
          className={cn(
            "h-[85svh] flex flex-col overflow-hidden",
            "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
          )}
        >
          <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Live Chat</span>
            </div>
            <div className="flex items-center gap-1">
              <Popover open={isUsernameOpen} onOpenChange={setIsUsernameOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11"
                    aria-label="Edit chat username"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  sideOffset={8}
                  className="z-[80] w-[min(20rem,calc(100vw-2rem))] p-3"
                >
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
                        autoFocus
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
                        disabled={usernameDraft.trim().length === 0}
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

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11"
                onClick={() => setFullChatOpen(false)}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <RadioChat variant="flat" showHeader={false} className="h-full min-h-0" />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isFullChatOpen} onOpenChange={setFullChatOpen}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-2xl">
        <div className="border-b border-border px-6 py-4">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Live Chat
              </DialogTitle>

              <Popover open={isUsernameOpen} onOpenChange={setIsUsernameOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-10 px-3 rounded-xl"
                    aria-label="Edit chat username"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="hidden sm:inline max-w-[160px] truncate text-sm">
                      {username}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  sideOffset={8}
                  className="z-[80] w-72 p-3"
                >
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
                        autoFocus
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
                        disabled={usernameDraft.trim().length === 0}
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
          </DialogHeader>
        </div>

        <div className="h-[70vh]">
          <RadioChat variant="flat" showHeader={false} className="h-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
