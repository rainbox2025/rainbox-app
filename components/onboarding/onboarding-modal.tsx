"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"; // Adjust path
import { useOnboarding } from "@/context/onboardingContext"; // Adjust path
import { OnboardingProgressBar } from "./progress-bar";
import { Step1Username } from "./steps/step1-username";
import { Step2Topics } from "./steps/step2-topics";
import { Step3Connections } from "./steps/step3-connections";
import { Step4GetApp } from "./steps/step4-get-app";
import { Step5Welcome } from "./steps/step5-welcome";
import { usePathname } from "next/navigation";

export const OnboardingModal = () => {
  const { currentStep, isOnboardingCompleted } = useOnboarding();
  // The modal's open state is now directly controlled by isOnboardingCompleted
  // No separate 'isOpen' state needed here for this logic.

  // const pathname = usePathname(); // If you need path-based logic

  const renderStepContent = () => {
    // ... (your switch statement for steps)
    switch (currentStep) {
      case 1: return <Step1Username />;
      case 2: return <Step2Topics />;
      case 3: return <Step3Connections />;
      case 4: return <Step4GetApp />;
      case 5: return <Step5Welcome />;
      default: return <Step1Username />;
    }
  };

  // If onboarding is completed, don't render the dialog at all.
  if (isOnboardingCompleted) {
    return null;
  }

  // Dialog is open if onboarding is NOT completed.
  // onOpenChange can be simplified or made to prevent closing if desired.
  const handleOpenChange = (open: boolean) => {
    // If you want to prevent users from closing the modal before completion:
    if (!open && !isOnboardingCompleted) {
      // Optionally, do nothing or re-assert it should be open.
      // For now, let's assume the Dialog component handles its own state
      // if the `open` prop is managed externally.
      // If the Dialog can be closed by Esc or overlay click,
      // and `isOnboardingCompleted` is false, it might "disappear"
      // without the process being finished.
      // The `open={!isOnboardingCompleted}` prop should largely handle this.
    }
  };

  return (
    <Dialog open={!isOnboardingCompleted} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-sm bg-content rounded-lg shadow-xl border border-border p-0 overflow-hidden"
        onInteractOutside={(e) => {
          // Prevent closing by clicking outside if onboarding is not complete
          if (!isOnboardingCompleted) {
            e.preventDefault();
          }
        }}
      // Consider adding onEscapeKeyDown={(e) => e.preventDefault()} if you want to block Esc key
      >
        <DialogHeader className="p-6 pb-0 border-b border-border">
          <OnboardingProgressBar />
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
};