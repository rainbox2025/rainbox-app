"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import { useOnboarding } from "@/context/onboardingContext";
import { Loader2 } from "lucide-react";

export const UsernameStep = () => {
  const { user } = useAuth();
  const { nextStep, checkUserName, updateUserName } = useOnboarding();

  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleUsernameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUserName(newUsername);
    setError("");
    setIsValid(false);

    if (newUsername.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(newUsername)) {
      setError("Only letters, numbers, and underscores are allowed.");
      return;
    }

    setIsChecking(true);
    try {
      const isAvailable = await checkUserName(newUsername);
      if (isAvailable) {
        setIsValid(true);
        setError("");
      } else {
        setIsValid(false);
        setError("This username is already taken.");
      }
    } catch (err) {
      setError("Error checking username.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || !user) return;

    setIsChecking(true);
    try {
      await updateUserName(user.id, userName);
      nextStep();
    } catch (err) {
      setError("Failed to save username. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

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
            type="text"
            placeholder="username"
            value={userName}
            onChange={handleUsernameChange}
            className={`w-full text-black dark:text-white rounded-r-none ${error ? "border-red-500" : "border-input"}`}
            disabled={isChecking}
          />
          <div className="bg-gray-100 dark:bg-neutral-900 flex items-center px-3 rounded-r-md border border-l-0 border-input text-sm text-muted-foreground">
            @rainbox.app
          </div>
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <Button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/80 w-full mt-4"
          size="sm"
          disabled={isChecking || !isValid}
        >
          {isChecking ? <Loader2 className="animate-spin h-4 w-4" /> : "Next →"}
        </Button>
      </form>
    </div>
  );
};