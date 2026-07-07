"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { changePasswordSchema, deleteAccountRequestSchema } from "@/types/profile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Settings as SettingsIcon, Loader2, Bell, Lock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
type DeleteAccountFormData = z.infer<typeof deleteAccountRequestSchema>;

export default function SettingsPage() {
  const router = useRouter();
  
  // Email notifications state
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Password change form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  // Delete account form
  const {
    register: registerDelete,
    handleSubmit: handleDeleteSubmit,
    reset: resetDelete,
    formState: { errors: deleteErrors },
  } = useForm<DeleteAccountFormData>({
    resolver: zodResolver(deleteAccountRequestSchema),
  });

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch settings");
        }

        setEmailNotificationsEnabled(data.data.emailNotificationsEnabled);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load settings");
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle email notifications toggle
  const handleToggleNotifications = async () => {
    try {
      setIsTogglingNotifications(true);

      const newValue = !emailNotificationsEnabled;

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotificationsEnabled: newValue }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to update notifications");
      }

      setEmailNotificationsEnabled(newValue);
      toast.success(`Email notifications ${newValue ? "enabled" : "disabled"}`);
    } catch (error) {
      console.error("Failed to toggle notifications:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update notifications");
    } finally {
      setIsTogglingNotifications(false);
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    try {
      setIsChangingPassword(true);

      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to change password");
      }

      resetPassword();
      toast.success("Password changed successfully!");
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle account deletion
  const onDeleteSubmit = async (data: DeleteAccountFormData) => {
    try {
      setIsDeletingAccount(true);

      const response = await fetch("/api/settings/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to submit deletion request");
      }

      setIsDeleteDialogOpen(false);
      resetDelete();
      
      toast.success(result.message || "Account deletion request submitted successfully", {
        description: "You will be signed out shortly.",
      });

      // Sign out after 3 seconds
      setTimeout(async () => {
        await signOut({ callbackUrl: "/" });
      }, 3000);
    } catch (error) {
      console.error("Failed to delete account:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit deletion request");
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="font-display text-3xl font-semibold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account preferences and security
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: Email Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <CardDescription>
              Control whether you receive email notifications for messages and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSettings ? (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Loading settings...</p>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    Email notifications are {emailNotificationsEnabled ? "enabled" : "disabled"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {emailNotificationsEnabled
                      ? "You will receive emails for new messages and important updates"
                      : "You will not receive any email notifications"}
                  </p>
                </div>
                <Button
                  onClick={handleToggleNotifications}
                  disabled={isTogglingNotifications}
                  variant={emailNotificationsEnabled ? "destructive" : "default"}
                >
                  {isTogglingNotifications ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : emailNotificationsEnabled ? (
                    "Disable"
                  ) : (
                    "Enable"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: Change Password */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  Current Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...registerPassword("currentPassword")}
                  placeholder="Enter your current password"
                  disabled={isChangingPassword}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  New Password <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword("newPassword")}
                  placeholder="Enter your new password"
                  disabled={isChangingPassword}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              {/* Submit Button */}
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Section 3: Delete Account */}
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back. This action will:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                <li>Send a deletion request to our admin team</li>
                <li>Log you out immediately</li>
                <li>Permanently delete all your data after admin approval</li>
              </ul>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This will submit an account deletion request to our admin team. You will be logged out immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeleteSubmit(onDeleteSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deletePassword">
                Enter your password to confirm <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deletePassword"
                type="password"
                {...registerDelete("currentPassword")}
                placeholder="Enter your password"
                disabled={isDeletingAccount}
              />
              {deleteErrors.currentPassword && (
                <p className="text-sm text-destructive">{deleteErrors.currentPassword.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  resetDelete();
                }}
                disabled={isDeletingAccount}
              >
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isDeletingAccount}>
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Yes, Delete My Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
