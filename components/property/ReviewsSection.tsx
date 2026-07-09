"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewForm } from "./ReviewForm";
import { cn } from "@/lib/utils";

interface Review {
  _id: string;
  rating: number;
  comment: string;
  reviewer: {
    _id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ReviewsSectionProps {
  propertyId: string;
}

export function ReviewsSection({ propertyId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch stats
      const statsResponse = await fetch(
        `/api/reviews/property/${propertyId}/stats`
      );
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }

      // Fetch reviews
      const reviewsResponse = await fetch(
        `/api/reviews/property/${propertyId}`
      );
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.data || []);
      }
    } catch (err) {
      setError("Failed to load reviews");
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const handleReviewSuccess = () => {
    fetchReviews(); // Refresh reviews after submission
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold">Reviews</h2>
        <div className="space-y-4">
          <div className="h-24 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded animate-pulse" />
          <div className="h-32 bg-muted rounded animate-pulse" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section>
        <h2 className="font-display text-2xl font-semibold mb-4">Reviews</h2>
        <p className="text-muted-foreground">{error}</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h2 className="font-display text-2xl font-semibold">Reviews</h2>

      {/* Stats Summary */}
      {stats && stats.reviewCount > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="font-display text-4xl font-semibold">
                  {stats.averageRating.toFixed(1)}
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "h-4 w-4",
                        star <= Math.round(stats.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.reviewCount} review{stats.reviewCount !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] || 0;
                  const percentage =
                    stats.reviewCount > 0
                      ? (count / stats.reviewCount) * 100
                      : 0;

                  return (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="text-sm w-8">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-right">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Form */}
      <ReviewForm propertyId={propertyId} onSuccess={handleReviewSuccess} />

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review._id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Reviewer Avatar */}
                  {review.reviewer.avatar ? (
                    <Image
                      src={review.reviewer.avatar}
                      alt={review.reviewer.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="font-semibold text-primary text-sm">
                        {review.reviewer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{review.reviewer.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-4 w-4",
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats && stats.reviewCount === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          No reviews yet. Be the first to review this property!
        </p>
      ) : null}
    </section>
  );
}
