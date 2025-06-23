import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from "@/context/authContext";
import {
  XMarkIcon,
  UserCircleIcon,
  CreditCardIcon as BillingIcon,
} from '@heroicons/react/24/outline';


export default function AccountTab() {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const handleDeleteAccount = () => {
    console.log("Delete account button clicked");
    setIsDeleteModalOpen(false);
    // Here you would typically call an API to delete the account
  };
  const { user } = useAuth();


  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Account</h2>
          <p className="text-muted-foreground text-sm">Manage your account settings</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-hovered flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt="User Avatar"
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-14 w-14 " />
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-primary rounded-full p-1 text-primary-foreground">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div>
              <h3 className="font-medium">Profile Image</h3>
              <p className="text-sm text-muted-foreground">Upload a new profile picture</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                id="name"
                defaultValue={user?.full_name}
                disabled
                className="w-full p-sm border border-border rounded-md bg-content focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
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
              className="px-4 py-2 text-sm text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
            >
              Delete account
            </button>
            <p className="text-xs text-muted-foreground mt-1">
              This will permanently delete your account and all associated data.
            </p>
          </div>
        </div>
      </div>


      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md mx-4 border border-border p-6"
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

            <p className="text-sm mb-6">
              All your data will be deleted permanently. Are you sure you want to delete your account?
            </p>

            <div className="mb-6">
              <label className="block text-sm mb-2">Feedback (Optional)</label>
              <textarea
                placeholder="Got a sec? Tell us why you're leaving and how we can improve."
                className="w-full border border-gray-300 rounded-lg p-4 focus:outline-none text-sm"
                rows={4}
              />
            </div>

            <div className="flex justify-between">

              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-3 bg-content text-sm font-medium rounded-full transition-colors"
              >
                Go back
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-sm text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
              >
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </>
  )
}
