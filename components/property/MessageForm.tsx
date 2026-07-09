"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Info } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

interface MessageFormProps {
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  onSuccess?: () => void;
}

export function MessageForm({
  propertyId,
  propertyTitle,
  ownerId,
  onSuccess,
}: MessageFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if the current user is the property owner
  const isOwner = session?.user?.id === ownerId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication
    if (status === "unauthenticated") {
      toast.error("Please login to send a message", {
        action: {
          label: "Login",
          onClick: () => router.push("/login"),
        },
      });
      return;
    }

    // Check if user is trying to message themselves
    if (isOwner) {
      toast.error("You cannot send a message to yourself");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          receiverId: ownerId,
          message: message.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      toast.success("Message sent successfully!", {
        description: "The property owner will receive your inquiry.",
      });

      setMessage("");
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="space-y-3">
        <div className="h-24 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // Show info card if user is the property owner
  if (isOwner && status === "authenticated") {
    return (
      <Card className="border-muted">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">
                This is your property. You cannot send messages to yourself.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder={
          status === "authenticated"
            ? `Send a message about ${propertyTitle}...`
            : "Login to send a message"
        }
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={status !== "authenticated" || loading}
        rows={4}
        className="resize-none"
      />
      <Button
        type="submit"
        className="w-full"
        disabled={status !== "authenticated" || loading || !message.trim()}
      >
        <Send className="mr-2 h-4 w-4" />
        {loading ? "Sending..." : "Send Message"}
      </Button>
      {status === "unauthenticated" && (
        <p className="text-sm text-muted-foreground text-center">
          Please{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-primary hover:underline"
          >
            login
          </button>{" "}
          to contact the property owner
        </p>
      )}
    </form>
  );
}
