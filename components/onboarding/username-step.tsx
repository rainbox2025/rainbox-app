"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import { useOnboarding } from "@/context/onboardingContext";
import { useDebounce } from "@/hooks/useDebounce";
import { Loader2 } from "lucide-react";
import { config } from "@/config";

export const UsernameStep = () => {
  const { user } = useAuth();
  const { nextStep, checkUserName, updateUserName } = useOnboarding();

  const [userName, setUserName] = useState("");
  const debouncedUserName = useDebounce(userName, 500); // Debounce the input value

  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create a ref for the input element to manage focus
  const inputRef = useRef<HTMLInputElement>(null);

  // This effect handles the username availability check
  useEffect(() => {
    // A function to prevent running on the initial empty state
    const checkAvailability = async () => {
      if (debouncedUserName.length < 3) {
        if (debouncedUserName.length > 0) setError("Username must be at least 3 characters.");
        setIsValid(false);
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(debouncedUserName)) {
        setError("Only letters, numbers, and underscores are allowed.");
        setIsValid(false);
        return;
      }

      setError("");
      setIsChecking(true);
      try {
        const isAvailable = await checkUserName(debouncedUserName);
        if (isAvailable) {
          setIsValid(true);
          setError("");
        } else {
          setIsValid(false);
          setError("This username is already taken.");
        }
      } catch (err) {
        setError("Error checking username.");
        setIsValid(false);
      } finally {
        setIsChecking(false);
      }
    };

    // Only run the check if the user has typed something
    if (debouncedUserName) {
      checkAvailability();
    } else {
      // Clear errors if input is empty
      setError("");
      setIsValid(false);
    }
  }, [debouncedUserName, checkUserName]); // Depend on the debounced value

  // This effect restores focus to the input after a check completes
  useEffect(() => {
    if (!isChecking && inputRef.current) {
      // Set focus and move cursor to the end of the input
      const end = inputRef.current.value.length;
      inputRef.current.setSelectionRange(end, end);
      inputRef.current.focus();
    }
  }, [isChecking]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // The onChange handler is now very simple: it only updates the state.
    setUserName(e.target.value.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !user) return;

    setIsSubmitting(true);
    try {
      await updateUserName(user.id, userName);
      nextStep();
    } catch (err) {
      setError("Failed to save username. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isChecking || isSubmitting;

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-md font-medium text-foreground">
        Welcome! Let's create your Rainbox email address.
      </h2>
      <p className="text-xs text-muted-foreground">
        This will be your unique address for subscribing to newsletters.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div className="flex relative">
          <Input
            ref={inputRef} // Attach the ref here
            type="text"
            placeholder="username"
            value={userName}
            onChange={handleUsernameChange}
            className={`w-full text-black dark:text-white rounded-r-none ${error ? "border-red-500" : "border-input"}`}
            disabled={isLoading}
            autoFocus // Automatically focus on mount
          />
          <div className="bg-gray-100 dark:bg-neutral-900 flex items-center px-3 rounded-r-md border border-l-0 border-input text-sm text-muted-foreground">
            @{config.emailDomain}
          </div>
          {isChecking && <Loader2 className="animate-spin h-4 w-4 absolute right-[130px] top-1/2 -translate-y-1/2 text-muted-foreground" />}
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <Button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/80 w-full mt-4"
          size="sm"
          disabled={isLoading || !isValid}
        >
          {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Next →"}
        </Button>
      </form>
    </div>
  );
};