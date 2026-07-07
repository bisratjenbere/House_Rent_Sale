"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useMessages } from "@/hooks/useMessages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

function MessagesContent() {
  const searchParams = useSearchParams();
  const propertyIdFromUrl = searchParams.get("property");
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const {
    // Conversations
    conversations,
    conversationsLoading,
    conversationsError,
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

    // Polling
    startPolling,
    stopPolling,
  } = useMessages();

  const [messageText, setMessageText] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize: fetch conversations and start polling
  useEffect(() => {
    fetchConversations();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchConversations, startPolling, stopPolling]);

  // Open specific conversation from URL parameter
  useEffect(() => {
    if (propertyIdFromUrl && !activePropertyId) {
      fetchThread(propertyIdFromUrl);
    }
  }, [propertyIdFromUrl, activePropertyId, fetchThread]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Handle send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !activePropertyId || sendingMessage) return;

    try {
      await sendMessage(activePropertyId, messageText.trim());
      setMessageText("");
      setNotification({
        type: "success",
        message: "Message sent successfully",
      });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to send message",
      });
      setTimeout(() => setNotification(null), 5000);
    }
  };

  // Handle Enter key to send (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-semibold">Messages</h1>
            <p className="text-muted-foreground mt-1">
              Chat with property owners and interested buyers
            </p>
          </div>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded flex items-center gap-3 ${
            notification.type === "success"
              ? "bg-primary/10 text-primary border border-primary"
              : "bg-destructive/10 text-destructive border border-destructive"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <XCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <p className="flex-1">{notification.message}</p>
          <button
            onClick={() => setNotification(null)}
            className="text-current hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>
      )}

      {/* Two-Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-20rem)]">
        {/* Left Panel: Conversations List */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <CardContent className="p-4 flex flex-col h-full">
            <h2 className="font-semibold text-lg mb-4">Conversations</h2>

            {/* Loading State */}
            {conversationsLoading && conversations.length === 0 && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {conversationsError && (
              <div className="flex items-center gap-3 text-destructive p-4">
                <AlertCircle className="h-5 w-5" />
                <p>{conversationsError}</p>
              </div>
            )}

            {/* Empty State */}
            {!conversationsLoading && conversations.length === 0 && !conversationsError && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Send a message to a property owner to start a conversation
                </p>
              </div>
            )}

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {conversations.map((conversation) => (
                <button
                  key={conversation.property._id}
                  onClick={() => fetchThread(conversation.property._id)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-colors hover:bg-muted",
                    activePropertyId === conversation.property._id && "bg-primary/10"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Property Image */}
                    <div className="relative h-12 w-12 rounded overflow-hidden flex-shrink-0">
                      {conversation.property.images?.[0]?.url ? (
                        <Image
                          src={conversation.property.images[0].url}
                          alt={conversation.property.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          <MessageSquare className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-medium text-sm truncate">
                          {conversation.property.title}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {conversation.otherParticipant.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.latestMessage.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel: Message Thread */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          {!activePropertyId ? (
            // Empty State - No conversation selected
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Select a conversation to view messages</p>
              </div>
            </CardContent>
          ) : (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b">
                {messagesLoading && messages.length === 0 ? (
                  <Skeleton className="h-6 w-48" />
                ) : (
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">
                      {conversations.find((c) => c.property._id === activePropertyId)?.property
                        .title || "Conversation"}
                    </h2>
                    <Button onClick={clearThread} variant="ghost" size="sm">
                      Close
                    </Button>
                  </div>
                )}
              </div>

              {/* Messages Area */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Loading State */}
                {messagesLoading && messages.length === 0 && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}

                {/* Error State */}
                {messagesError && (
                  <div className="flex items-center gap-3 text-destructive p-4">
                    <AlertCircle className="h-5 w-5" />
                    <p>{messagesError}</p>
                  </div>
                )}

                {/* Messages */}
                {messages.map((message) => {
                  const isOwnMessage = message.sender._id === currentUserId;

                  return (
                    <div
                      key={message._id}
                      className={cn("flex gap-3", isOwnMessage ? "justify-end" : "justify-start")}
                    >
                      {!isOwnMessage && (
                        <div className="flex-shrink-0">
                          {message.sender.avatar ? (
                            <div className="relative h-8 w-8 rounded-full overflow-hidden">
                              <Image
                                src={message.sender.avatar}
                                alt={message.sender.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg p-3",
                          isOwnMessage ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-medium mb-1">{message.sender.name}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>

                      {isOwnMessage && (
                        <div className="flex-shrink-0">
                          {message.sender.avatar ? (
                            <div className="relative h-8 w-8 rounded-full overflow-hidden">
                              <Image
                                src={message.sender.avatar}
                                alt={message.sender.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Reply Area */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message... (Shift+Enter for new line)"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sendingMessage}
                    className="resize-none"
                    rows={3}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim() || sendingMessage}
                    className="flex-shrink-0"
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <MessagesContent />
    </Suspense>
  )
}
