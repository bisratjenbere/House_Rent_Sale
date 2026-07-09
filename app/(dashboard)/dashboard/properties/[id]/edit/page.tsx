"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { propertyBaseSchema } from "@/types/property";

const PropertyForm = dynamic(
  () => import("@/components/property/PropertyForm").then((m) => m.PropertyForm),
  { ssr: false, loading: () => <div className="min-h-[600px] bg-muted rounded animate-pulse" /> }
);

type PropertyFormData = z.infer<typeof propertyBaseSchema>;

interface Property extends PropertyFormData {
  _id: string;
  status: string;
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await fetch(`/api/properties/${propertyId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Property not found");
        }

        setProperty(data.data);
      } catch (error) {
        console.error("Failed to fetch property:", error);
        setLoadError(error instanceof Error ? error.message : "Failed to load property");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId]);

  const handleSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    setNotification(null);

    try {
      const response = await fetch(`/api/properties/${propertyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update property");
      }

      setNotification({
        type: "success",
        message: "Property updated successfully!",
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard/properties");
      }, 1500);
    } catch (error) {
      console.error("Failed to update property:", error);
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to update property",
      });
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading property...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (loadError || !property) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link
            href="/dashboard/properties"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Listings
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{loadError || "Property not found"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Listings
        </Link>
        <h1 className="font-display text-3xl font-semibold">Edit Property</h1>
        <p className="text-muted-foreground mt-2">
          Update your property details below. Changes will be saved to your existing listing.
        </p>
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

      {/* Status Info Banner for Published Properties */}
      {property.status === "published" && (
        <div className="mb-6 p-4 rounded bg-accent/10 border border-accent flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-accent">Important Notice</p>
            <p className="text-sm text-muted-foreground mt-1">
              This property is currently published. Editing it will change its status to "Pending
              Review" and it will need admin approval before being published again.
            </p>
          </div>
        </div>
      )}

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm
            initialData={property}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            showSubmitForReview={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
