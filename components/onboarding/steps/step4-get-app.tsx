"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/onboardingContext";

const primaryButtonClasses = "bg-primary text-primary-foreground hover:bg-primary/80";
const secondaryButtonClasses = "text-muted-foreground hover:bg-accent";

export const Step4GetApp = () => {
  const { nextStep, previousStep } = useOnboarding();

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-md font-medium text-foreground">Read anywhere, anytime</h2>
      <Image
        src="/getAppImage.png"
        alt="Rainbox App Showcase"
        className="w-full h-auto rounded-md mt-4"
        width={350}
        height={300}
        style={{ aspectRatio: "350/300", objectFit: "contain" }}
        priority
      />
      <div className="flex justify-end space-x-2 mt-6">
        <Button
          variant="ghost"
          onClick={previousStep}
          className={secondaryButtonClasses}
          size="sm"
        >
          ← Back
        </Button>
        <Button
          onClick={nextStep} // This will call finalizeOnboarding if it's the last step (currentStep === 5)
          className={primaryButtonClasses}
          size="sm"
        >
          Next →
        </Button>
      </div>
    </div>
  );
};