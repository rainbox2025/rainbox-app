import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from "@/context/authContext";
import {
  XMarkIcon,
  UserCircleIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { ArrowPathIcon } from '@heroicons/react/24/solid';

export default function AccountTab() {
  const { user, updateAvatar, deleteAccount, updateFullName } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [isNameSaving, setIsNameSaving] = useState(false);

  useEffect(() => {
    if (user?.full_name) {
      setFullName(user.full_name);
    }
  }, [user?.full_name]);

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAvatarUploading(true);
    try {
      await updateAvatar(file);
    } catch (error) {
      console.error("Avatar upload failed:", error);
      alert(error instanceof Error ? error.message : "An unknown error occurred.");
    } finally {
      setIsAvatarUploading(false);
      if (avatarInputRef.current) {
        avatarInputRef.current.value = "";
      }
    }
  };

  const handleSaveName = async () => {
    if (fullName.trim() === user?.full_name || !fullName.trim()) return;
    setIsNameSaving(true);
    try {
      await updateFullName(fullName.trim());
    } catch (error) {
      console.error("Failed to save name:", error);
      alert("Failed to update name. Please try again.");
      setFullName(user?.full_name || '');
    } finally {
      setIsNameSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount(feedback);
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const nameHasChanged = fullName.trim() !== "" && fullName.trim() !== user?.full_name;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Account</h2>
          <p className="text-muted-foreground text-sm">Manage your account settings</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <input
              type="file"
              ref={avatarInputRef}
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg"
              disabled={isAvatarUploading}
            />
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-hovered flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt="User Avatar"
                    width={64}
                    height={64}
                    className="rounded-full object-cover"
                    key={user.avatar_url}
                  />
                ) : (
                  <UserCircleIcon className="h-14 w-14 " />
                )}
                {isAvatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                    <ArrowPathIcon className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={isAvatarUploading}
                className="absolute bottom-0 right-0 bg-primary rounded-full p-1 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div>
              <h3 className="font-medium">Profile Image</h3>
              <p className="text-sm text-muted-foreground">Click the + to upload a picture.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isNameSaving}
                  className="w-full p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
                {nameHasChanged && (
                  <button
                    onClick={handleSaveName}
                    disabled={isNameSaving}
                    className="p-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center"
                  >
                    {isNameSaving ? (
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email address</label>
              <input
                type="email"
                id="email"
                defaultValue={user?.email || ""}
                disabled
                className="w-full p-sm border border-border rounded-md bg-sidebar focus:outline-none text-sm cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 text-sm bg-destructive/20 hover:bg-destructive/20 rounded-md transition-colors"
            >
              Delete account
            </button>
            <p className="text-xs text-muted-foreground mt-1">
              This will permanently delete your account and all associated data.
            </p>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-content text-card-foreground rounded-lg shadow-xl w-full max-w-md mx-4 border border-border p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Delete Account</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-xl font-bold"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              All your data will be deleted permanently. Are you sure you want to delete your account?
            </p>

            <div className="mb-6">
              <label className="block text-sm mb-2 text-muted-foreground">Feedback (Optional)</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Got a sec? Tell us why you're leaving and how we can improve."
                className="w-full border border-border bg-transparent rounded-lg p-4 focus:outline-none text-sm"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-hovered text-sm font-medium rounded-md transition-colors"
              >
                Go back
              </button>

              <button
                onClick={handleDeleteAccount}
                className="flex items-center justify-center px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded-md transition-colors text-sm"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}