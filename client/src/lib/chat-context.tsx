import * as React from "react";
import { subscribeToChat, sendChatMessage, ChatMessage } from "@/lib/firebase";
import { getCookie, setCookie } from "@/lib/cookies";

const CHAT_USERNAME_COOKIE_NAME = "gt_chat_username";
const CHAT_USERNAME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type ChatContextValue = {
  messages: ChatMessage[];
  username: string;
  setUsername: (username: string) => void;
  sendMessage: (message: string) => Promise<void>;
  isFullChatOpen: boolean;
  setFullChatOpen: (open: boolean) => void;
  notificationMessage: ChatMessage | null;
  isNotificationVisible: boolean;
  dismissNotification: () => void;
  openFullChat: () => void;
};

const ChatContext = React.createContext<ChatContextValue | null>(null);

type ChatIdentityContextValue = {
  username: string;
  setUsername: (username: string) => void;
};

const ChatIdentityContext = React.createContext<ChatIdentityContextValue | null>(null);

function generateDefaultUsername(): string {
  return `Listener${Math.floor(Math.random() * 1000)}`;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [username, setUsernameState] = React.useState<string>(() => {
    const stored = getCookie(CHAT_USERNAME_COOKIE_NAME);
    return stored && stored.trim().length > 0 ? stored : generateDefaultUsername();
  });

  const [isFullChatOpen, setFullChatOpen] = React.useState(false);
  const [notificationMessageId, setNotificationMessageId] = React.useState<string | null>(null);
  const [isNotificationVisible, setIsNotificationVisible] = React.useState(false);

  const lastNonSystemMessageIdRef = React.useRef<string | null>(null);
  const lastSeenMessageIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setCookie(CHAT_USERNAME_COOKIE_NAME, username, {
      maxAgeSeconds: CHAT_USERNAME_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
  }, [username]);

  React.useEffect(() => {
    const unsubscribe = subscribeToChat((newMessages) => {
      setMessages(newMessages);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const onOpen = () => {
      setFullChatOpen(true);
    };
    window.addEventListener("gt:open-chat", onOpen);
    return () => window.removeEventListener("gt:open-chat", onOpen);
  }, []);

  React.useEffect(() => {
    const lastNonSystem = [...messages].reverse().find((m) => !m.isSystem);
    if (!lastNonSystem) return;

    const id = String(lastNonSystem.id ?? lastNonSystem.timestamp);
    const prevId = lastNonSystemMessageIdRef.current;
    lastNonSystemMessageIdRef.current = id;

    if (!prevId) return;
    if (id === prevId) return;
    if (isFullChatOpen) return;
    if (lastNonSystem.username === username) return;
    if (lastSeenMessageIdRef.current === id) return;

    setNotificationMessageId(id);
    setIsNotificationVisible(true);
  }, [isFullChatOpen, messages, username]);

  React.useEffect(() => {
    if (!notificationMessageId || !isNotificationVisible) return;

    const timer = window.setTimeout(() => {
      setIsNotificationVisible(false);
      lastSeenMessageIdRef.current = notificationMessageId;
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [isNotificationVisible, notificationMessageId]);

  React.useEffect(() => {
    if (!isFullChatOpen) return;

    setIsNotificationVisible(false);
    if (lastNonSystemMessageIdRef.current) {
      lastSeenMessageIdRef.current = lastNonSystemMessageIdRef.current;
    }
  }, [isFullChatOpen]);

  const notificationMessage = React.useMemo(() => {
    if (!notificationMessageId) return null;
    return (
      [...messages]
        .reverse()
        .find((m) => String(m.id ?? m.timestamp) === notificationMessageId) ?? null
    );
  }, [messages, notificationMessageId]);

  const setUsername = React.useCallback((next: string) => {
    const trimmed = next.trim();
    if (!trimmed) return;
    setUsernameState(trimmed);
  }, []);

  const sendMessage = React.useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed) return;
      await sendChatMessage(username, trimmed);
    },
    [username],
  );

  const dismissNotification = React.useCallback(() => {
    setIsNotificationVisible(false);
    if (notificationMessageId) {
      lastSeenMessageIdRef.current = notificationMessageId;
    }
  }, [notificationMessageId]);

  const openFullChat = React.useCallback(() => {
    setFullChatOpen(true);
  }, []);

  const identityValue = React.useMemo<ChatIdentityContextValue>(
    () => ({
      username,
      setUsername,
    }),
    [setUsername, username],
  );

  const value = React.useMemo<ChatContextValue>(
    () => ({
      messages,
      username,
      setUsername,
      sendMessage,
      isFullChatOpen,
      setFullChatOpen,
      notificationMessage,
      isNotificationVisible,
      dismissNotification,
      openFullChat,
    }),
    [
      dismissNotification,
      isFullChatOpen,
      isNotificationVisible,
      messages,
      notificationMessage,
      openFullChat,
      sendMessage,
      setUsername,
      username,
    ],
  );

  return (
    <ChatIdentityContext.Provider value={identityValue}>
      <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    </ChatIdentityContext.Provider>
  );
}

export function useChat(): ChatContextValue {
  const ctx = React.useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used within a ChatProvider.");
  }
  return ctx;
}

export function useChatIdentity(): ChatIdentityContextValue {
  const ctx = React.useContext(ChatIdentityContext);
  if (!ctx) {
    throw new Error("useChatIdentity must be used within a ChatProvider.");
  }
  return ctx;
}
