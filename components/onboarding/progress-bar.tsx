"use client";
import React from "react";
import { useOnboarding } from "@/context/onboardingContext"; // Adjust path if needed

export const OnboardingProgressBar = () => {
  const { currentStep } = useOnboarding();
  const totalSteps = 5; // Define total number of steps

  return (
    <div className="w-[90%] mb-5 bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300"
        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
      ></div>
    </div>
  );
};