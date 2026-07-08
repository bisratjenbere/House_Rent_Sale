"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PropertyForm } from "@/components/property/PropertyForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { z } from "zod";
import { propertyBaseSchema } from "@/types/property";

type PropertyFormData = z.infer<typeof propertyBaseSchema>;

export default function NewPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSubmit = async (data: PropertyFormData, submitForReview: boolean = false) => {
    setIsSubmitting(true);
    setNotification(null);

    try {
      // Debug: Log the form data being submitted
      console.log('=== FORM DATA BEING SUBMITTED ===');
      console.log('Images count:', data.images?.length || 0);
      console.log('Images data:', JSON.stringify(data.images, null, 2));
      console.log('Full data:', JSON.stringify(data, null, 2));
      
      // Create the property
      const createResponse = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const createData = await createResponse.json();

      if (!createData.success) {
        throw new Error(createData.error || "Failed to create property");
      }

      const propertyId = createData.data._id;

      // If submitForReview is true, call the submit endpoint
      if (submitForReview) {
        const submitResponse = await fetch(`/api/properties/${propertyId}/submit`, {
          method: "POST",
        });

        const submitData = await submitResponse.json();

        if (!submitData.success) {
          throw new Error(submitData.error || "Failed to submit property for review");
        }

        setNotification({
          type: "success",
          message: "Property created and submitted for review successfully!",
        });
      } else {
        setNotification({
          type: "success",
          message: "Property saved as draft successfully!",
        });
      }

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/dashboard/properties");
      }, 1500);
    } catch (error) {
      console.error("Failed to create property:", error);
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to create property",
      });
      setIsSubmitting(false);
    }
  };

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
        <h1 className="font-display text-3xl font-semibold">Add New Property</h1>
        <p className="text-muted-foreground mt-2">
          Fill in the details below to list your property for rent or sale.
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

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            showSubmitForReview={true}
          />
        </CardContent>
      </Card>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-muted rounded">
        <h3 className="font-semibold mb-2">What happens next?</h3>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>
            <strong>Save as Draft:</strong> Your property will be saved but not visible to
            others. You can edit it anytime.
          </li>
          <li>
            <strong>Submit for Review:</strong> Your property will be sent to our admin team
            for approval before being published.
          </li>
        </ul>
      </div>
    </div>
  );
}
