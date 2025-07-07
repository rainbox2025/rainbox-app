"use client";
import { config } from "@/config";
import { useAuth } from "@/context/authContext";
import { createClient } from "@/utils/supabase/client";
import { enqueueSnackbar, SnackbarProvider } from "notistack";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";

export default function AddMailBox({
  showAddMailbox,
  handleCloseModal,
  username,
  setUsername,
}: {
  showAddMailbox: boolean;
  handleCloseModal: () => void;
  username: string;
  setUsername: (username: string) => void;
}) {
  const supabase = createClient();
  const { user, secondaryEmails, setSecondaryEmails } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const handleCreateMail = async (name: string) => {
    try {
      const { data: existingMailbox, error: existingMailboxError } =
        await supabase
          .from("secondary_emails")
          .select("*")
          .eq("name", name)
          .eq("user_id", user?.id);
      if (existingMailboxError) {
        setError(existingMailboxError.message);
        return;
      }
      if (existingMailbox.length > 0) {
        setError("User name already exists.");
        return;
      }
      await supabase.from("secondary_emails").insert({
        user_id: user?.id,
        name: name,
      });

      setError("");
      setMessage("Mailbox created successfully");
      setSecondaryEmails([...secondaryEmails, name]);
      enqueueSnackbar("Mailbox created successfully", {
        variant: "success",
      });
      setUsername("");
      handleCloseModal();
    } catch (error) {
      console.log(error);
      setError("An error occurred while adding the secondary email.");
    }
  };
  return (
    <div>
      <SnackbarProvider />

      {showAddMailbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm w-[100vw]">
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-content  rounded-lg shadow-xl w-full max-w-sm mx-4 border border-gray-100/80"
            >
              <div className="p-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-sm font-semibold">Add a New Mailbox</h2>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Create a new Rainbox address for your Newsletters
                    </p>
                  </div>

                  <button
                    onClick={handleCloseModal}
                    className="text-muted-foreground hover:text-secondary-foreground"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex">
                  <input
                    type="text"
                    placeholder="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-sm border border-border dark:border-border rounded-md 
                      bg-content dark:bg-content 
                      focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  />
                  <div className="bg-sidebar px-3 py-3 border-t border-r border-b rounded-r-md text-sm">
                    @{config.emailDomain}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  {error && (
                    <div className="text-red-500 text-sm mt-2">{error}</div>
                  )}
                  {message && (
                    <div className="text-green-500 text-sm mt-2">{message}</div>
                  )}
                  <div className="flex justify-end space-x-2 mt-4">
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCreateMail(username)}
                      className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors text-sm relative"
                    >
                      <span className="text-sm ">Done</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
