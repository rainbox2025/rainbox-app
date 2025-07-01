"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useOnboarding } from "@/context/onboardingContext";
import { UsernameStep } from "./username-step";
import { TopicsStep } from "./topics-step";
import { ConnectStep } from "./connect-step";
import { GetAppStep } from "./get-app-step";
import { CompleteStep } from "./complete-step";
import { Loader2 } from "lucide-react";

export const OnboardingFlow = () => {
  const { currentStep, isOnboardingComplete } = useOnboarding();
  const [modalState, setModalState] = useState<'loading' | 'open' | 'closed'>('loading');

  useEffect(() => {
    // This function now runs only once on mount to determine the initial state
    const checkStatus = async () => {
      try {
        const isComplete = await isOnboardingComplete();
        setModalState(isComplete ? 'closed' : 'open');
      } catch (error) {
        console.error("Failed to check onboarding status:", error);
        setModalState('closed'); // Close on error to not block the user
      }
    };
    checkStatus();
  }, [isOnboardingComplete]);

  const renderProgressBar = () => (
    <div className="w-[90%] mb-5 bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300"
        style={{ width: `${(currentStep / 5) * 100}%` }}
      />
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <UsernameStep />;
      case 2: return <TopicsStep />;
      case 3: return <ConnectStep />;
      case 4: return <GetAppStep />;
      case 5: return <CompleteStep />;
      default: return <UsernameStep />;
    }
  };

  // If the state is loading or closed, render nothing.
  if (modalState === 'loading' || modalState === 'closed') {
    return null;
  }

  // Only render the Dialog when we are certain it should be open.
  return (
    <Dialog open={modalState === 'open'} onOpenChange={(isOpen) => !isOpen && setModalState('closed')}>
      <DialogContent className="sm:max-w-sm bg-content rounded-lg shadow-xl border border-border p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0 border-b border-border">
          {renderProgressBar()}
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};