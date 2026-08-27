import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChat } from "@/lib/chat-context";

export function ChatMiniNotification() {
  const shouldReduceMotion = useReducedMotion();
  const {
    notificationMessage,
    isNotificationVisible,
    dismissNotification,
    openFullChat,
  } = useChat();

  if (!notificationMessage) return null;

  return (
    <AnimatePresence>
      {isNotificationVisible && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "fixed z-[60]",
            "left-4 right-4 sm:left-auto sm:right-4 sm:w-[360px]",
          )}
          style={{
            bottom:
              "calc(var(--gt-radio-player-offset, 80px) + env(safe-area-inset-bottom) + 0.75rem)",
          }}
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={() => {
              dismissNotification();
              openFullChat();
            }}
            className={cn(
              "w-full text-left",
              "rounded-2xl border border-border/50 bg-card/35 backdrop-blur-xl shadow-lg",
              "px-4 py-3",
              "transition-colors hover:bg-card",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
                <MessageCircle className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">
                    {notificationMessage.username}
                  </span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    New message
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {notificationMessage.message}
                </p>
              </div>

              <div className="-mr-2 -mt-1 flex-shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dismissNotification();
                  }}
                  aria-label="Dismiss chat notification"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
