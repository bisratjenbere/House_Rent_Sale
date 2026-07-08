"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageData {
  url: string;
  publicId: string;
}

interface ImageUploaderProps {
  images: ImageData[];
  onChange: (images: ImageData[]) => void;
  maxImages?: number;
  className?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function ImageUploader({
  images,
  onChange,
  maxImages = 10,
  className,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Only JPG, PNG, and WebP images are allowed`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File size must be less than 5MB`;
    }
    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setError(null);

    // Check if adding these files would exceed max
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    // Validate all files first
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setUploading(true);

    try {
      const uploadedImages: ImageData[] = [];

      for (const file of files) {
        // Use unsigned upload (simpler, no signature needed)
        const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const upload_preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

        if (!cloud_name || !upload_preset) {
          throw new Error("Cloudinary configuration missing. Please check environment variables.");
        }

        // Log upload parameters for debugging
        console.log("Upload parameters:", {
          cloud_name,
          upload_preset,
          file: file.name,
          fileSize: file.size,
          fileType: file.type,
        });

        // Upload to Cloudinary (unsigned)
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", upload_preset);
        formData.append("folder", "properties");

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!uploadRes.ok) {
          // Log the full error response from Cloudinary
          let errorData: any = {};
          const responseText = await uploadRes.text();
          
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            errorData = { raw: responseText };
          }
          
          console.error("Cloudinary upload failed:", {
            status: uploadRes.status,
            statusText: uploadRes.statusText,
            errorData,
            file: file.name,
            responseText: responseText.substring(0, 500), // First 500 chars
          });
          
          const errorMessage = errorData.error?.message || errorData.message || uploadRes.statusText || "Unknown error";
          throw new Error(`Failed to upload ${file.name}: ${errorMessage}`);
        }

        const uploadData = await uploadRes.json();

        uploadedImages.push({
          url: uploadData.secure_url,
          publicId: uploadData.public_id,
        });
      }

      onChange([...images, ...uploadedImages]);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to upload images"
      );
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Button */}
      {canAddMore && (
        <div>
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="cursor-pointer"
              asChild
            >
              <span>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Images
                  </>
                )}
              </span>
            </Button>
          </label>
          <p className="mt-2 text-sm text-muted-foreground">
            JPG, PNG, or WebP. Max 5MB per file. Up to {maxImages} images.
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Image Count */}
      {images.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {images.length} / {maxImages} images uploaded
        </p>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <div
              key={`${image.publicId}-${index}`}
              className="group relative aspect-square overflow-hidden rounded border border-border bg-muted"
            >
              <Image
                src={image.url}
                alt={`Property image ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={uploading}
                className="absolute right-2 top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 transition-opacity hover:bg-destructive/90 group-hover:opacity-100 disabled:opacity-50"
                aria-label="Remove image"
              >
                <X className="h-4 w-4" />
              </button>
              {/* Primary Badge (first image) */}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                  Primary
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
