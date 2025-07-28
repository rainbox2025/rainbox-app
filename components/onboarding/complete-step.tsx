"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import { useOnboarding } from "@/context/onboardingContext";

export const CompleteStep = () => {
  const { user } = useAuth();
  console.log("user: ", user);
  const { completeOnboarding } = useOnboarding();
  return (
    <div className="space-y-4 p-6 overflow-y-scroll custom-scrollbar">
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Image src="/RainboxLogo.png" width={48} height={48} alt="Rainbox Logo" className="mb-4" />
        <h2 className="text-md font-medium text-foreground">
          Hey {user?.full_name || "there"},
        </h2>
        <p className="text-xs text-muted-foreground mt-1 mb-6 flex items-center justify-center">
          Welcome to your
          <Image src="/RainboxLogo.png" width={16} height={16} alt="Rainbox" className="inline h-4 w-4 mx-0.5" />
          Rainbox
        </p>
        <Button onClick={completeOnboarding} className="bg-primary text-primary-foreground hover:bg-primary/80 w-full py-2.5" size="sm">
          Start Reading →
        </Button>
      </div>
    </div>
  );
};