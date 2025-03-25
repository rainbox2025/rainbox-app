"use client";
import { useOnboarding } from "@/context/onboardingContext";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Check, Loader2 } from "lucide-react";

import { createClient } from "@/utils/supabase/client";
import { useAuth } from "@/context/authContext";
export const Onboardingmodal = () => {
  const {
    isOnboardingComplete,
    setCurrentStep,
    nextStep,
    previousStep,
    checkUserName,
    updateUserName,
    currentStep,
  } = useOnboarding();
  const supabase = createClient();
  const [userName, setUserName] = useState("lodash");
  const [userNameError, setUserNameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();

  // Add effect to focus input on mount
  useEffect(() => {
    if (!user) return;
  }, [user]);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setUserNameError("Username cannot be empty");
      return;
    }

    if (isUsernameValid) {
      updateUserName(user?.id || "", userName);
      nextStep();
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUserName(newUsername);
    if (!newUsername.trim()) {
      setUserNameError("Username cannot be empty");
    }
  };

  const completeOnboarding = () => {
    // In a real app, you would mark onboarding as complete in the database
    // For now, we'll just close the modal or redirect
    window.location.href = "/dashboard"; // You can replace this with actual redirection logic
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-md-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Create your Newsletter email address
            </h3>
            <p className="text-sm text-gray-600">
              Subscribe to newsletters with this email address
            </p>

            <form onSubmit={handleUsernameSubmit} className="space-y-md-4">
              <div className="flex relative">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Username"
                  name="username"
                  value={userName}
                  onChange={handleUsernameChange}
                  className={`rounded-r-none ${!isUsernameValid && userName.trim() && !isCheckingUsername ? "border-red-500" : isUsernameValid && userName.trim() && !isCheckingUsername ? "border-green-500" : ""}`}
                  disabled={isCheckingUsername}
                  autoFocus
                />
                <div className="bg-gray-100 flex items-center px-3 rounded-r-md">
                  @rainbox.app
                </div>
                {isUsernameValid && userName.trim() && !isCheckingUsername && (
                  <div className="absolute right-14 top-1/2 transform -translate-y-1/2">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                )}
                {isCheckingUsername && (
                  <div className="absolute right-14 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                  </div>
                )}
              </div>
              {isCheckingUsername && (
                <p className="text-blue-500 text-sm">
                  Checking username availability...
                </p>
              )}
              {userNameError && !isCheckingUsername && (
                <p className="text-red-500 text-sm">{userNameError}</p>
              )}
              {!isUsernameValid && userName.trim() && !isCheckingUsername ? (
                <p className="text-xs text-amber-600">
                  <span className="font-medium">Already taken.</span> Please try
                  a different email address
                </p>
              ) : null}
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span>⚠️</span> You won't be able to change this email address
                later
              </p>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  isCheckingUsername || !isUsernameValid || !userName.trim()
                }
              >
                {isCheckingUsername ? "Checking..." : "Next"}
              </Button>
            </form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-md-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Get your newsletters from Gmail or Outlook to Rainbox
            </h3>

            <div className="bg-gray-100 rounded-md p-4 text-center mb-4">
              [Image Placeholder]
            </div>

            <p className="text-sm">
              You can set email forwarding rules to automatically send your
              newsletter emails from Gmail and Outlook to Rainbox
            </p>

            <ul className="list-disc list-inside space-y-md-2 text-sm">
              <li>
                Instructions for email forwarding:
                <ul className="list-inside ml-5 mt-1">
                  <li>
                    <a href="#" className="text-blue-500 hover:underline">
                      Gmail
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-blue-500 hover:underline">
                      Outlook
                    </a>
                  </li>
                </ul>
              </li>
              <li>
                Pro Tip: Add a '+newsletter_name' to the rainbox email address
                to uniquely identify the newsletters
                <p className="mt-1">
                  Example:{" "}
                  <span className="text-blue-500">{userName}@rainbox.app</span>
                  +newslettername@rainbox.app
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  *Auto-populated with your rainbox email address
                </p>
              </li>
            </ul>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={previousStep}>
                Back
              </Button>
              <Button onClick={nextStep}>Next</Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-md-4">
            <h3 className="text-lg font-semibold border-b pb-2">
              Upgrade to Pro for the best experience
            </h3>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium">Free Plan</h4>
                <p className="font-bold">FREE</p>
                <ul className="mt-4 space-y-md-2">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    <span>10 Newsletters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    <span>50 email history per Newsletter</span>
                  </li>
                </ul>
              </div>

              <div className="border rounded-lg p-4 border-blue-200 bg-blue-50">
                <h4 className="font-medium">Pro Plan</h4>
                <div className="flex items-center gap-2">
                  <p className="font-bold">$20/year</p>
                  <span className="text-sm text-gray-500">$2.5/mo</span>
                </div>
                <ul className="mt-4 space-y-md-2">
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    <span>Unlimited Newsletters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    <span>Unlimited history</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    <span>AI Summary</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={16} className="text-green-500" />
                    <span>Text to Speech</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={previousStep}>
                Back
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={completeOnboarding}>
                  Continue with Free plan
                </Button>
                <Button
                  className="bg-blue-500 hover:bg-blue-600"
                  onClick={completeOnboarding}
                >
                  Upgrade to Pro
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => { }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Onboarding</DialogTitle>
          <div className="w-full bg-gray-200 h-2 rounded-full mt-2">
            <div
              className="bg-pink-500 h-2 rounded-full"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </DialogHeader>
        <DialogDescription>{renderStep()}</DialogDescription>
      </DialogContent>
    </Dialog>
  );
};
