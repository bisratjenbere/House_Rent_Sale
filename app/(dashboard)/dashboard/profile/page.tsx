"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateProfileSchema } from "@/types/profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Loader2, CheckCircle, XCircle, Upload } from "lucide-react";

type ProfileFormData = z.infer<typeof updateProfileSchema>;

interface ProfileData {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });

  const avatarUrl = watch("avatar");

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch profile");
        }

        setProfile(data.data);
        reset({
          name: data.data.name || "",
          phone: data.data.phone || "",
          bio: data.data.bio || "",
          avatar: data.data.avatar || "",
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setNotification({
          type: "error",
          message: error instanceof Error ? error.message : "Failed to load profile",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      setNotification({
        type: "error",
        message: "Please upload a JPG, PNG, or WebP image",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotification({
        type: "error",
        message: "Image must be less than 5MB",
      });
      return;
    }

    try {
      setIsUploadingAvatar(true);

      // Get Cloudinary signature
      const signatureResponse = await fetch("/api/upload/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "avatars" }),
      });

      const signatureData = await signatureResponse.json();
      if (!signatureData.success) {
        throw new Error("Failed to get upload signature");
      }

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signatureData.data.apiKey);
      formData.append("timestamp", signatureData.data.timestamp.toString());
      formData.append("signature", signatureData.data.signature);
      formData.append("folder", "avatars");

      const uploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${signatureData.data.cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const uploadData = await uploadResponse.json();

      if (!uploadData.secure_url) {
        throw new Error("Upload failed");
      }

      // Update form value
      setValue("avatar", uploadData.secure_url);

      setNotification({
        type: "success",
        message: "Avatar uploaded successfully",
      });

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to upload avatar",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: ProfileFormData) => {
    try {
      setIsSubmitting(true);
      setNotification(null);

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to update profile");
      }

      // Update local state
      setProfile(result.data);

      // Update session if name changed
      if (data.name) {
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            name: data.name,
          },
        });
      }

      setNotification({
        type: "success",
        message: "Profile updated successfully!",
      });

      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-semibold">My Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal information and public profile
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

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-24 w-24 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                    className="hidden"
                  />
                  <label htmlFor="avatar-upload">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingAvatar}
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                      asChild
                    >
                      <span>
                        {isUploadingAvatar ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {isUploadingAvatar ? "Uploading..." : "Upload Photo"}
                      </span>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG or WebP. Max 5MB.
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="Enter your phone number"
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your phone number will be visible to interested buyers
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...register("bio")}
                placeholder="Tell others about yourself..."
                disabled={isSubmitting}
                rows={4}
                className="resize-none"
              />
              {errors.bio && (
                <p className="text-sm text-destructive">{errors.bio.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum 500 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => reset({
                  name: profile?.name || '',
                  phone: profile?.phone || '',
                  bio: profile?.bio || '',
                  avatar: profile?.avatar || '',
                })}
                disabled={isSubmitting}
              >
                Reset
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
