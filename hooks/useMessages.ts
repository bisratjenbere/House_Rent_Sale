import { useState, useEffect, useCallback, useRef } from "react";

// Types
interface Property {
  _id: string;
  title: string;
  images: { url: string; publicId: string }[];
}

interface Participant {
  _id: string;
  name: string;
  avatar?: string;
}

interface Message {
  _id: string;
  sender: Participant;
  receiver: Participant;
  message: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  property: Property;
  otherParticipant: Participant;
  latestMessage: {
    message: string;
    createdAt: string;
    sender: string;
  };
  unreadCount: number;
  lastMessageAt: string;
}

interface ConversationsResponse {
  success: boolean;
  data?: {
    conversations: Conversation[];
    total: number;
    page: number;
    pages: number;
  };
  error?: string;
}

interface ThreadResponse {
  success: boolean;
  data?: {
    messages: Message[];
  };
  error?: string;
}

interface UnreadCountResponse {
  success: boolean;
  data?: {
    unreadCount: number;
  };
  error?: string;
}

interface UseMessagesReturn {
  // Conversations list
  conversations: Conversation[];
  conversationsLoading: boolean;
  conversationsError: string | null;
  conversationsPage: number;
  conversationsTotalPages: number;
  fetchConversations: (page?: number) => Promise<void>;

  // Active thread
  activePropertyId: string | null;
  messages: Message[];
  messagesLoading: boolean;
  messagesError: string | null;
  fetchThread: (propertyId: string) => Promise<void>;
  clearThread: () => void;

  // Send message
  sendMessage: (propertyId: string, message: string) => Promise<void>;
  sendingMessage: boolean;

  // Unread count
  unreadCount: number;
  fetchUnreadCount: () => Promise<void>;

  // Polling control
  startPolling: () => void;
  stopPolling: () => void;
  isPolling: boolean;
}

const POLLING_INTERVAL = 30000; // 30 seconds

export function useMessages(): UseMessagesReturn {
  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [conversationsPage, setConversationsPage] = useState(1);
  const [conversationsTotalPages, setConversationsTotalPages] = useState(1);

  // Thread state
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Send message state
  const [sendingMessage, setSendingMessage] = useState(false);

  // Unread count state
  const [unreadCount, setUnreadCount] = useState(0);

  // Polling state
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations list
  const fetchConversations = useCallback(async (page: number = 1) => {
    try {
      setConversationsLoading(true);
      setConversationsError(null);

      const response = await fetch(`/api/messages?page=${page}`);
      const data: ConversationsResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch conversations");
      }

      setConversations(data.data?.conversations || []);
      setConversationsPage(data.data?.page || 1);
      setConversationsTotalPages(data.data?.pages || 1);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      setConversationsError(
        error instanceof Error ? error.message : "Failed to load conversations"
      );
    } finally {
      setConversationsLoading(false);
    }
  }, []);

  // Fetch thread messages for a property
  const fetchThread = useCallback(async (propertyId: string) => {
    try {
      setMessagesLoading(true);
      setMessagesError(null);
      setActivePropertyId(propertyId);

      const response = await fetch(`/api/messages/property/${propertyId}`);
      const data: ThreadResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch messages");
      }

      setMessages(data.data?.messages || []);
    } catch (error) {
      console.error("Failed to fetch thread:", error);
      setMessagesError(error instanceof Error ? error.message : "Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Clear active thread
  const clearThread = useCallback(() => {
    setActivePropertyId(null);
    setMessages([]);
    setMessagesError(null);
  }, []);

  // Send a new message
  const sendMessage = useCallback(
    async (propertyId: string, message: string) => {
      try {
        setSendingMessage(true);

        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ propertyId, message }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to send message");
        }

        // Refresh thread if it's the active one
        if (activePropertyId === propertyId) {
          await fetchThread(propertyId);
        }

        // Refresh conversations to update latest message
        await fetchConversations(conversationsPage);
      } catch (error) {
        console.error("Failed to send message:", error);
        throw error; // Re-throw so caller can handle
      } finally {
        setSendingMessage(false);
      }
    },
    [activePropertyId, conversationsPage, fetchThread, fetchConversations]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch("/api/messages/unread-count");
      const data: UnreadCountResponse = await response.json();

      if (data.success && data.data) {
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  // Polling function — use ref to avoid stale closures recreating the interval
  const activePropertyIdRef = useRef<string | null>(null);
  const conversationsPageRef = useRef<number>(1);

  useEffect(() => { activePropertyIdRef.current = activePropertyId; }, [activePropertyId]);
  useEffect(() => { conversationsPageRef.current = conversationsPage; }, [conversationsPage]);

  const poll = useCallback(async () => {
    await fetchUnreadCount();
    if (!activePropertyIdRef.current) {
      await fetchConversations(conversationsPageRef.current);
    } else {
      await fetchThread(activePropertyIdRef.current);
    }
  }, [fetchUnreadCount, fetchConversations, fetchThread]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    setIsPolling(true);
    poll();
    pollingIntervalRef.current = setInterval(poll, POLLING_INTERVAL);
  }, [poll]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    // Conversations
    conversations,
    conversationsLoading,
    conversationsError,
    conversationsPage,
    conversationsTotalPages,
    fetchConversations,

    // Thread
    activePropertyId,
    messages,
    messagesLoading,
    messagesError,
    fetchThread,
    clearThread,

    // Send message
    sendMessage,
    sendingMessage,

    // Unread count
    unreadCount,
    fetchUnreadCount,

    // Polling
    startPolling,
    stopPolling,
    isPolling,
  };
}
