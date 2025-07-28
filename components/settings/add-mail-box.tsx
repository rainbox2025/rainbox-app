"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SnackbarProvider } from "notistack";
import { Loader2 } from "lucide-react";

import { config } from "@/config";
import { useAuth } from "@/context/authContext";
import { useDebounce } from "@/hooks/useDebounce";
import { createClient } from "@/utils/supabase/client";

export default function AddMailBox({
  showAddMailbox,
  handleCloseModal,
}: {
  showAddMailbox: boolean;
  handleCloseModal: () => void;
}) {
  const supabase = createClient();
  const { user, secondaryEmails, setSecondaryEmails } = useAuth();

  const [mailboxName, setMailboxName] = useState("");
  const debouncedMailboxName = useDebounce(mailboxName, 500);

  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wasCheckingRef = useRef(false);

  const checkMailboxAvailability = async (name: string) => {
    try {
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("user_name")
        .eq("user_name", name)
        .single();

      if (userError && userError.code !== "PGRST116") {
        throw new Error("Failed to check primary usernames.");
      }
      if (existingUser) {
        return false;
      }

      const { data: existingMailbox, error: mailboxError } = await supabase
        .from("secondary_emails")
        .select("name")
        .eq("name", name)
        .single();

      if (mailboxError && mailboxError.code !== "PGRST116") {
        throw new Error("Failed to check secondary mailboxes.");
      }
      if (existingMailbox) {
        return false;
      }

      return true;
    } catch (err) {
      console.error(err);
      setError("Error checking availability. Please try again.");
      return false;
    }
  };

  useEffect(() => {
    const validateMailboxName = async () => {
      if (debouncedMailboxName.length < 3) {
        if (debouncedMailboxName.length > 0)
          setError("Name must be at least 3 characters.");
        setIsValid(false);
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(debouncedMailboxName)) {
        setError("Only letters, numbers, and underscores are allowed.");
        setIsValid(false);
        return;
      }

      setError("");
      setIsChecking(true);
      wasCheckingRef.current = true;
      try {
        const isAvailable = await checkMailboxAvailability(
          debouncedMailboxName
        );
        if (isAvailable) {
          setIsValid(true);
          setError("");
        } else {
          setIsValid(false);
          setError("This name is already taken.");
        }
      } catch (err) {
        setIsValid(false);
        setError("Error checking name. Please try again.");
      } finally {
        setIsChecking(false);
      }
    };

    if (debouncedMailboxName) {
      validateMailboxName();
    } else {
      setError("");
      setIsValid(false);
      setIsChecking(false);
      wasCheckingRef.current = false;
    }
  }, [debouncedMailboxName]);

  useEffect(() => {
    if (wasCheckingRef.current && !isChecking) {
      inputRef.current?.focus();
      wasCheckingRef.current = false;
    }
  }, [isChecking]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMailboxName(e.target.value.toLowerCase().trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !user || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      const { error: insertError } = await supabase
        .from("secondary_emails")
        .insert({
          user_id: user.id,
          name: mailboxName,
        });

      if (insertError) throw insertError;

      setSecondaryEmails([...secondaryEmails, mailboxName]);
      setMailboxName("");
      handleCloseModal();
    } catch (err) {
      console.error(err);
      setError("Failed to create mailbox. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetStateAndClose = () => {
    setMailboxName("");
    setError("");
    setIsValid(false);
    setIsChecking(false);
    setIsSubmitting(false);
    handleCloseModal();
  };

  const isLoading = isChecking || isSubmitting;

  return (
    <div>
      <SnackbarProvider />
      <AnimatePresence>
        {showAddMailbox && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-content rounded-lg shadow-xl w-full max-w-sm mx-4 border border-border"
            >
              <form onSubmit={handleSubmit} className="p-md">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                    <h2 className="text-sm font-semibold">Add a New Mailbox</h2>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Create a new Rainbox address for your newsletters.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetStateAndClose}
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

                <div
                  className={`flex w-full items-center rounded-md border h-10 ${error ? "border-red-500" : "border-input"
                    }`}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="mailbox-name"
                    value={mailboxName}
                    onChange={handleInputChange}
                    className="w-full h-full px-3 border-0 bg-transparent focus:outline-none focus:ring-0 text-sm"
                    disabled={isLoading}
                    autoFocus
                  />
                  <div className="relative pr-2">
                    {isChecking && (
                      <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex items-center h-full whitespace-nowrap bg-sidebar rounded-r-md px-3 text-sm text-muted-foreground border-l">
                    @{config.emailDomain}
                  </div>
                </div>

                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    onClick={resetStateAndClose}
                    className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-md transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/80 rounded-md transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isValid || isLoading}
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin h-4 w-4 mx-auto" />
                    ) : (
                      "Create Mailbox"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}