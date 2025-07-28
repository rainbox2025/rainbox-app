"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/context/onboardingContext";

export const GetAppStep = () => {
  const { nextStep, previousStep } = useOnboarding();
  return (
    <div className="space-y-2 px-6 overflow-y-scroll custom-scrollbar">
      <h2 className="text-md font-medium text-foreground">Read anywhere, anytime</h2>
      <Image
        src="/getAppImage.png"
        alt="Rainbox App Showcase"
        width={350}
        height={300}
        className="w-full h-auto rounded-md mt-4"
        style={{ aspectRatio: "350/300", objectFit: "contain" }}
      />
      <div className="flex justify-between space-x-2 pb-4">
        <Button variant="ghost" onClick={previousStep} size="sm">← Back</Button>
        <Button onClick={nextStep} size="sm">Do it later →</Button>
      </div>
    </div>
  );
};