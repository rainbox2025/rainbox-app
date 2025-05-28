"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/onboardingContext";
import { useAuth } from "@/context/authContext"; // Assuming you still use this for user ID

const primaryButtonClasses = "bg-primary text-primary-foreground hover:bg-primary/80";

export const Step1Username = () => {
  const {
    nextStep,
    checkUserNameAvailability,
    saveRainboxUserName,
    userName: contextUsername, // This is the persisted username
    setLocalUsername: setContextLocalUsername, // For immediate UI update in context if needed
  } = useOnboarding();

  const { user } = useAuth ? useAuth() : { user: { id: "mock-user-id" } };

  const [localInputUsername, setLocalInputUsername] = useState(contextUsername || ""); // Input field's value
  const [fullName, setFullName] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isUsernameValidAndAvailable, setIsUsernameValidAndAvailable] = useState(false);

  const usernameInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to validate username initially if loaded from context
  useEffect(() => {
    if (contextUsername) {
      setLocalInputUsername(contextUsername);
      // Optionally, re-validate if the component mounts with a pre-filled username
      // This might not be necessary if you trust the persisted state
      // validateAndCheck(contextUsername.trim(), true);
      setIsUsernameValidAndAvailable(true); // Assume valid if from context, or re-validate
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextUsername]); // React to changes in contextUsername

  const validateAndCheck = useCallback(async (usernameToValidate: string, skipDebounce = false) => {
    setUsernameError("");
    setIsUsernameValidAndAvailable(false);
    // setContextLocalUsername(usernameToValidate); // Update context's local view

    if (usernameToValidate.length === 0) {
      setIsChecking(false);
      return;
    }
    if (usernameToValidate.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      setIsChecking(false);
      return;
    }
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(usernameToValidate)) {
      setUsernameError("Only letters, numbers, and underscores allowed.");
      setIsChecking(false);
      return;
    }

    setIsChecking(true);

    const performCheck = async () => {
      try {
        const isAvailable = await checkUserNameAvailability(usernameToValidate);
        if (isAvailable) {
          setIsUsernameValidAndAvailable(true);
          setUsernameError("");
        } else {
          setIsUsernameValidAndAvailable(false);
          setUsernameError("Username is already taken.");
        }
      } catch (error) {
        console.error("Error checking username:", error);
        setUsernameError("Error checking username. Please try again.");
        setIsUsernameValidAndAvailable(false);
      } finally {
        setIsChecking(false);
        usernameInputRef.current?.focus();
      }
    };

    if (skipDebounce) {
      performCheck();
    } else {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(performCheck, 500);
    }

  }, [checkUserNameAvailability, /*setContextLocalUsername*/]);

  const handleUsernameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setLocalInputUsername(newUsername);
    validateAndCheck(newUsername.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUserName = localInputUsername.trim();

    if (!trimmedUserName) {
      setUsernameError("Username cannot be empty");
      setIsUsernameValidAndAvailable(false);
      return;
    }

    if (!isUsernameValidAndAvailable || isChecking) {
      if (!usernameError && !isChecking) setUsernameError("Username is not valid, available, or check is pending.");
      usernameInputRef.current?.focus();
      return;
    }

    if (!user || !user.id) {
      setUsernameError("User not authenticated. Cannot save username.");
      return;
    }

    setIsChecking(true);
    try {
      // Directly use localInputUsername as it's the source of truth for the input
      const { error: saveError } = await saveRainboxUserName(user.id, trimmedUserName);
      if (saveError) {
        // Handle specific Supabase errors, e.g., unique constraint violation if caught late
        if (saveError.message.includes("duplicate key value violates unique constraint")) {
          setUsernameError("This username was just taken. Please choose another.");
        } else {
          setUsernameError(`Failed to save username: ${saveError.message}`);
        }
        setIsUsernameValidAndAvailable(false); // Mark as invalid if save failed
      } else {
        console.log("Username saved, proceeding to next step");
        setContextLocalUsername(trimmedUserName); // Ensure context reflects the saved name
        nextStep();
      }
    } catch (error) { // Catch unexpected errors from the save function itself
      console.error("Error during username submission:", error);
      setUsernameError("An unexpected error occurred. Please try again.");
      setIsUsernameValidAndAvailable(false);
    } finally {
      setIsChecking(false);
      usernameInputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-md font-medium text-foreground">Let's create your <br /> Rainbox email address</h2>
      <p className="text-xs text-muted-foreground">
        Create your dedicated Rainbox address for newsletters.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <Input
          type="text"
          placeholder="Your name (Optional)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full text-sm"
        />
        <div className="flex relative">
          <Input
            ref={usernameInputRef}
            type="text"
            placeholder="username"
            name="username"
            value={localInputUsername}
            onChange={handleUsernameInputChange}
            className={`w-full text-black dark:text-white focus:outline-none text-sm focus:ring-0 !outline-none rounded-r-none ${localInputUsername.trim() && !isUsernameValidAndAvailable && !isChecking && usernameError ? "border-red-500" : "border-input"
              }`}
            disabled={isChecking && localInputUsername.trim().length > 0}
            aria-invalid={!!(localInputUsername.trim() && !isUsernameValidAndAvailable && usernameError)}
            aria-describedby="username-error"
            autoFocus // Focus on this field when the step loads
          />
          <div className="bg-gray-100 dark:bg-neutral-900 flex items-center px-3 rounded-r-md border border-l-0 border-input text-sm text-muted-foreground">
            @rainbox.app
          </div>
        </div>
        {isChecking && localInputUsername.trim().length > 0 && <p className="text-xs text-muted-foreground">Checking availability...</p>}
        {usernameError && (
          <p id="username-error" className="text-red-500 text-xs">{usernameError}</p>
        )}
        {!isChecking && isUsernameValidAndAvailable && localInputUsername.trim().length > 0 && (
          <p className="text-green-500 text-xs">Username is available!</p>
        )}
        <Button
          type="submit"
          className={`${primaryButtonClasses} w-full mt-4`}
          size="sm"
          disabled={isChecking || !isUsernameValidAndAvailable || !localInputUsername.trim()}
        >
          {isChecking && localInputUsername.trim().length > 0 ? "Saving..." : "Next →"}
        </Button>
      </form>
    </div>
  );
};