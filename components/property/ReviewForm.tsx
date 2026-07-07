"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  propertyId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ propertyId, onSuccess }: ReviewFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(true);

  // Check eligibility on mount
  useEffect(() => {
    const checkEligibility = async () => {
      if (status !== "authenticated") {
        setEligible(false);
        setCheckingEligibility(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/reviews/property/${propertyId}/eligibility`
        );
        const data = await response.json();

        if (response.ok) {
          setEligible(data.eligible || false);
        } else {
          setEligible(false);
        }
      } catch (error) {
        console.error("Failed to check eligibility:", error);
        setEligible(false);
      } finally {
        setCheckingEligibility(false);
      }
    };

    checkEligibility();
  }, [propertyId, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (status === "unauthenticated") {
      toast.error("Please login to write a review", {
        action: {
          label: "Login",
          onClick: () => router.push("/login"),
        },
      });
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propertyId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      toast.success("Review submitted successfully!");

      setRating(0);
      setComment("");
      setEligible(false); // Hide form after submission
      onSuccess?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit review"
      );
    } finally {
      setLoading(false);
    }
  };

  // Don't show anything while checking eligibility
  if (checkingEligibility) {
    return (
      <div className="py-4">
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  // Don't show form if not eligible
  if (!eligible) {
    return null;
  }

  return (
    <div className="border-t border-border pt-6">
      <h3 className="font-semibold text-lg mb-4">Write a Review</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                {rating} star{rating !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div className="space-y-2">
          <label htmlFor="comment" className="text-sm font-medium">
            Your Review
          </label>
          <Textarea
            id="comment"
            placeholder="Share your experience with this property..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
            rows={4}
            className="resize-none"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || rating === 0 || !comment.trim()}
          className="w-full"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </Button>
      </form>
    </div>
  );
}
