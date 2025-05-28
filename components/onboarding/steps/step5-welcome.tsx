"use client";
import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/onboardingContext";
import { useRouter } from "next/navigation";

const primaryButtonClasses = "bg-primary text-primary-foreground hover:bg-primary/80";

export const Step5Welcome = () => {
  // userName will be the one persisted and loaded by the context
  const { userName, finalizeOnboarding } = useOnboarding();
  const router = useRouter();

  const handleStartReading = () => {
    finalizeOnboarding(); // Mark onboarding as fully complete
    router.push("/dashboard");
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Image src="/RainboxLogo.png" width={48} height={48} alt="Rainbox Logo" className="mb-4" />
        {/* Use the userName from context, which should be the saved Rainbox username */}
        <h2 className="text-md font-medium text-foreground">Hey {userName || "User"},</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6 flex items-center justify-center">
          Welcome to your
          <Image src="/RainboxLogo.png" width={16} height={16} alt="Rainbox" className="inline h-4 w-4 mx-0.5" />
          Rainbox
        </p>
        <Button
          onClick={handleStartReading}
          className={`${primaryButtonClasses} w-full py-2.5`}
          size="sm"
        >
          Start Reading →
        </Button>
      </div>
    </div>
  );
};